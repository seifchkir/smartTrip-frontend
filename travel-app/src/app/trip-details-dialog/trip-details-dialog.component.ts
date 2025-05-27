import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
// First, let's add an interface for the badge structure
interface Badge {
  icon: string;
  label: string;
  color?: string;
}

interface BudgetItem {
  category: string;
  amount: string;
  description: string;
  icon: string;
  class: string;
}

@Component({
  selector: 'app-trip-details-dialog',
  templateUrl: './trip-details-dialog.component.html',
  styleUrls: ['./trip-details-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    HttpClientModule
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class TripDetailsDialogComponent implements OnInit {
  // Add these properties to track map state
  activeTab = 0;
  tripOverviewText: string = '';
  map: any = null;
  mapInitialized = false;
  mapMarkers: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<TripDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Set the overview text once during initialization
    console.log('Raw recommendation:', this.data.rawRecommendationString);

    // Use the raw recommendation string directly if available
    this.tripOverviewText = this.data.rawRecommendationString ||
                           this.data.extracted_info?.recommendation ||
                           this.data.recommendation ||
                           this.getTripOverview();

    // Extract locations from itinerary for map markers
    this.extractLocationsFromItinerary();
  }

  // Extract locations from the itinerary with improved filtering
  extractLocationsFromItinerary() {
    if (!this.data?.itineraryDays) return;

    const locations: {name: string, day: number, description: string}[] = [];

    // First, add the main destination as the primary marker
    if (this.data.destinationName) {
      locations.push({
        name: this.data.destinationName,
        day: 0, // Day 0 indicates main destination
        description: `Your trip to ${this.data.destinationName}`
      });
    }

    // Process each day in the itinerary
    this.data.itineraryDays.forEach((day: any, dayIndex: number) => {
      if (!day.steps) return;

      // Look for location mentions in each step
      day.steps.forEach((step: string) => {
        // Extract location names using more sophisticated patterns
        const locationPatterns = [
          // Pattern for common phrases like "to [Location]", "at [Location]", "in [Location]" followed by capitalized words
          /(?:(?:to|at|in|near|through|visit|explore|go to|arrive at|travel to|head to|drive to|see|spot|hike through)\s+)(?:the\s+)?([A-Z][a-zA-Z\s-]+?(?:\s(?:International Airport|National Park|Waterfall|Refuge|Village|Cultural Center|Falls|Beach|Museum|Castle|Palace|Cathedral|Temple|Mountain|Island|Lake|City|Town|Area|Reserve|Port|Station|Harbor|Bay|Coast|River|Lake|Forest|Jungle|Desert|Valley|Peak|Point|Bridge|Square|Street|Road|Route|Highway|Trail|Path|Ruins|Site|Center|Gardens|Market|Shop|Store|Restaurant|Cafe|Bar|Club|Hotel|Resort|Lodge|Villa|Apartment|House|Building|Tower|Bridge|Tunnel|Dam))?)(?:\.|\,|\s|$)/g,
          // Pattern for capitalized sequences that are likely place names (e.g., proper nouns)
          /\b([A-Z][a-zA-Z\s-]+?(?:\s[A-Z][a-zA-Z\s]*)*)\b(?=.*(?:International Airport|National Park|Waterfall|Refuge|Village|Cultural Center|Falls|Beach|Museum|Castle|Palace|Cathedral|Temple|Mountain|Island|Lake|City|Town|Area|Reserve|Port|Station|Harbor|Bay|Coast|River|Lake|Forest|Jungle|Desert|Valley|Peak|Point|Bridge|Square|Street|Road|Route|Highway|Trail|Path|Ruins|Site|Center|Gardens|Market|Shop|Store|Restaurant|Cafe|Bar|Club|Hotel|Resort|Lodge|Villa|Apartment|House|Building|Tower|Bridge|Tunnel|Dam))?/g
        ];

        const stepLocations: string[] = [];

        for (const pattern of locationPatterns) {
          let match;
          while ((match = pattern.exec(step)) !== null) {
            const locationName = match[1].trim();

            // Enhanced filtering of non-locations and generic terms
            const nonLocations = [
              'morning', 'afternoon', 'evening', 'breakfast', 'lunch', 'dinner',
              'hotel', 'day', 'time', 'hour', 'minute', 'second', 'today', 'tomorrow',
              'night', 'early', 'late', 'first', 'last', 'next', 'previous',
              'the surrounding landscape', 'the surrounding rainforest', 'local and international cuisine',
              'crystal-clear waters', 'a picturesque setting', 'exotic species', 'a protected area',
              'memories of your peaceful and immersive experience', 'the best rates', 'specific travel preferences and choices',
              'arrive', 'check-in', 'enjoy', 'take', 'visit', 'return', 'check-out', 'depart', 'budget', 'food', 'please', 'additionally', 'i recommend',
              'flights', 'accommodation', 'activities', 'miscellaneous', 'total'
            ];

            // Skip if it contains common non-location words or phrases (case-insensitive)
            if (nonLocations.some(word => locationName.toLowerCase().includes(word.toLowerCase()))) {
              continue;
            }

            // Skip if it's too short or consists of only one word unless it's a known single-word location (e.g., Paris, Rome)
            const knownSingleWordLocations = ['Paris', 'Rome', 'Bali', 'Tokyo', 'London']; // Add more as needed
            if (locationName.length < 4 || (locationName.split(' ').length === 1 && !knownSingleWordLocations.includes(locationName))) {
              continue;
            }

            // Skip if it ends with common non-location words
            const endingNonLocations = ['activities', 'cuisine', 'landscape', 'wildlife', 'experience', 'rates', 'choices'];
            if (endingNonLocations.some(word => locationName.toLowerCase().endsWith(word))) {
              continue;
            }

            // Avoid adding duplicates within the same step
            if (!stepLocations.some(loc => loc.toLowerCase() === locationName.toLowerCase())) {
              stepLocations.push(locationName);
            }
          }
        }

        // Add unique locations from this step to the main locations array
        stepLocations.forEach(locationName => {
          // Avoid duplicates across all days
          if (!locations.some(loc => loc.name.toLowerCase() === locationName.toLowerCase())) {
            locations.push({
              name: locationName,
              day: dayIndex + 1,
              description: step // Use the whole step as description for now
            });
          }
        });

      });
    });

    console.log('Extracted locations BEFORE slicing:', locations);

    // Limit to a reasonable number of locations (main destination + up to 10 more)
    this.mapMarkers = locations.slice(0, 11);
  }

  // Improved geocoding with better context and region biasing
  async geocodeDestination(destination: string): Promise<[number, number] | null> {
    // Add context from the main destination for better geocoding
    const mainDestination = this.data.destinationName || '';
    let searchQuery = destination;

    // If this isn't the main destination, add context
    if (destination !== mainDestination && mainDestination) {
      searchQuery = `${destination}, ${mainDestination}`;
    }

    console.log(`Geocoding: ${searchQuery}`);

    try {
      console.log(`Geocoding ${searchQuery} with Nominatim`);

      // Add a small delay to respect Nominatim's usage policy (1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Format the query and encode it
      const query = encodeURIComponent(searchQuery);

      // Get the country or region from the main destination to use as a viewbox
      // This helps bias results to the correct region
      let viewbox = '';
      let countryCode = '';

      // Extract country from main destination
      if (mainDestination.includes('Costa Rica')) {
        // Costa Rica bounding box (roughly)
        viewbox = '&viewbox=-86.0,-8.0,-82.0,12.0';
        countryCode = '&countrycodes=cr';
      } else if (mainDestination.includes('Japan')) {
        viewbox = '&viewbox=122.0,24.0,146.0,46.0';
        countryCode = '&countrycodes=jp';
      } else if (mainDestination.includes('Italy')) {
        viewbox = '&viewbox=6.0,36.0,19.0,48.0';
        countryCode = '&countrycodes=it';
      }
      // Add more countries as needed

      // Make the API request with better parameters including viewbox and country code
      const response: any = await this.http.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}${viewbox}${countryCode}&limit=1&addressdetails=1`
      ).toPromise();

      // Check if we got a result
      if (response && response.length > 0) {
        const lat = parseFloat(response[0].lat);
        const lon = parseFloat(response[0].lon);
        console.log(`Found coordinates for ${searchQuery}: [${lat}, ${lon}]`);

        // Verify the coordinates are in a reasonable range for the destination
        if (this.validateCoordinates(lat, lon, mainDestination)) {
          return [lat, lon];
        } else {
          console.log(`Coordinates for ${searchQuery} are outside expected region`);
        }
      } else {
        console.log(`No coordinates found for ${searchQuery}`);

        // If we tried with context and failed, try without context
        if (searchQuery !== destination) {
          console.log(`Trying without context: ${destination}`);

          // Add a small delay to respect Nominatim's usage policy
          await new Promise(resolve => setTimeout(resolve, 1000));

          const simpleQuery = encodeURIComponent(destination);
          const simpleResponse: any = await this.http.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${simpleQuery}${viewbox}${countryCode}&limit=1`
          ).toPromise();

          if (simpleResponse && simpleResponse.length > 0) {
            const lat = parseFloat(simpleResponse[0].lat);
            const lon = parseFloat(simpleResponse[0].lon);
            console.log(`Found coordinates for ${destination}: [${lat}, ${lon}]`);

            // Verify the coordinates are in a reasonable range
            if (this.validateCoordinates(lat, lon, mainDestination)) {
              return [lat, lon];
            } else {
              console.log(`Coordinates for ${destination} are outside expected region`);
            }
          }
        }
      }

      // If we get here, we couldn't find valid coordinates
      // Fall back to a default location for the main destination
      return this.getDefaultCoordinates(mainDestination);

    } catch (error) {
      console.error(`Error geocoding ${searchQuery}:`, error);
      return this.getDefaultCoordinates(mainDestination);
    }
  }

  // Helper method to validate coordinates are in the expected region
  validateCoordinates(lat: number, lon: number, destination: string): boolean {
    // Define bounding boxes for common destinations
    const boundingBoxes: {[key: string]: {minLat: number, maxLat: number, minLon: number, maxLon: number}} = {
      'Costa Rica': {minLat: 8.0, maxLat: 11.5, minLon: -86.0, maxLon: -82.0},
      'Japan': {minLat: 24.0, maxLat: 46.0, minLon: 122.0, maxLon: 146.0},
      'Italy': {minLat: 36.0, maxLat: 48.0, minLon: 6.0, maxLon: 19.0},
      // Add more as needed
    };

    // Check if we have a bounding box for this destination
    for (const [key, box] of Object.entries(boundingBoxes)) {
      if (destination.includes(key)) {
        return lat >= box.minLat && lat <= box.maxLat && lon >= box.minLon && lon <= box.maxLon;
      }
    }

    // If we don't have a specific bounding box, return true
    return true;
  }

  // Helper method to get default coordinates for a destination
  getDefaultCoordinates(destination: string): [number, number] | null {
    const defaultCoords: {[key: string]: [number, number]} = {
      'Costa Rica': [9.7489, -83.7534],
      'San José, Costa Rica': [9.9281, -84.0907],
      'Arenal Volcano, Costa Rica': [10.4626, -84.7071],
      'La Fortuna, Costa Rica': [10.4671, -84.6446],
      'Japan': [36.2048, 138.2529],
      'Tokyo, Japan': [35.6762, 139.6503],
      'Italy': [41.8719, 12.5674],
      'Rome, Italy': [41.9028, 12.4964],
      // Add more defaults as needed
    };

    // Check for exact match
    if (defaultCoords[destination]) {
      console.log(`Using default coordinates for ${destination}`);
      return defaultCoords[destination];
    }

    // Check for partial match
    for (const [key, coords] of Object.entries(defaultCoords)) {
      if (destination.includes(key) || key.includes(destination)) {
        console.log(`Using default coordinates for partial match: ${key}`);
        return coords;
      }
    }

    // If no match found, return null
    return null;
  }

  getTripOverview(): string {
    if (!this.data) return '';

    const destination = this.data.destinationName || 'your destination';
    const days = this.data.itineraryDays?.length || 0;

    // Extract trip theme from badges if available
    let tripTheme = '';
    if (this.data.badges && this.data.badges.length > 0) {
      const themeLabel = this.data.badges.find((b: Badge) => b.icon === 'fa-leaf')?.label;
      if (themeLabel) {
        tripTheme = ` focusing on ${themeLabel.toLowerCase()}`;
      }
    }

    // Extract budget from badges if available
    let budget = '';
    if (this.data.badges && this.data.badges.length > 0) {
      const budgetLabel = this.data.badges.find((b: Badge) => b.icon === 'fa-dollar-sign')?.label;
      if (budgetLabel) {
        budget = ` with a budget of ${budgetLabel}`;
      }
    }

    // Create a dynamic introduction based on destination
    const intro = `Based on your preferences, I recommend a ${days}-day trip to ${destination}. ${destination} offers ${this.getDestinationFeatures(destination)} and a range of ${this.getTripActivities()} activities.`;

    return intro + `\n\nExplore the beautiful ${destination} with this personalized itinerary${tripTheme}${budget}. Your trip includes ${days} days of carefully planned activities.`;
  }

  // Helper method to generate destination features
  getDestinationFeatures(destination: string): string {
    // Map of destinations to their features
    const destinationFeatures: {[key: string]: string[]} = {
      'Costa Rica': ['lush rainforests', 'diverse wildlife', 'beautiful beaches'],
      'Japan': ['rich cultural heritage', 'modern cities', 'stunning natural landscapes'],
      'Italy': ['historical architecture', 'world-class cuisine', 'artistic masterpieces'],
      'Australia': ['unique wildlife', 'stunning coastlines', 'vibrant cities'],
      'Thailand': ['tropical beaches', 'ancient temples', 'vibrant street life'],
      'Canada': ['pristine wilderness', 'friendly locals', 'diverse landscapes'],
      'France': ['romantic ambiance', 'exquisite cuisine', 'artistic heritage'],
      'New Zealand': ['dramatic landscapes', 'outdoor adventures', 'Maori culture'],
      'Morocco': ['colorful markets', 'desert landscapes', 'rich history'],
      'Greece': ['ancient ruins', 'crystal-clear waters', 'Mediterranean cuisine']
    };

    // Default features for destinations not in our map
    const defaultFeatures = ['breathtaking scenery', 'unique cultural experiences', 'unforgettable memories'];

    // Get features for this destination or use default
    const features = destinationFeatures[destination] || defaultFeatures;

    // Return two random features from the list
    const selectedFeatures = features.sort(() => 0.5 - Math.random()).slice(0, 2);
    return selectedFeatures.join(' and ');
  }

  // Helper method to generate trip activities based on badges
  getTripActivities(): string {
    if (!this.data?.badges) return 'exciting';

    const activityMap: {[key: string]: string} = {
      'fa-hiking': 'outdoor',
      'fa-umbrella-beach': 'relaxation',
      'fa-landmark': 'cultural',
      'fa-leaf': 'nature',
      'fa-mountain': 'adventure',
      'fa-utensils': 'culinary',
      'fa-camera': 'photography',
      'fa-ship': 'water'
    };

    // Find matching activities from badges
    const activities = this.data.badges
      .filter((b: Badge) => activityMap[b.icon])
      .map((b: Badge) => activityMap[b.icon]);

    // If no matching activities found, return a default
    if (activities.length === 0) return 'exciting';

    // Return unique activities (up to 2)
    const uniqueActivities = [...new Set(activities)].slice(0, 2);
    return uniqueActivities.join(' and ');
  }

  // Make sure these methods are in your component class
  getTripStyle(): string {
    if (!this.data?.badges) return '';

    const styleBadge = this.data.badges.find((b: Badge) =>
      ['fa-hiking', 'fa-umbrella-beach', 'fa-landmark', 'fa-leaf'].includes(b.icon));

    return styleBadge?.label || '';
  }

  getTotalBudget(): string {
    if (!this.data?.badges) return '';

    const budgetBadge = this.data.badges.find((b: Badge) => b.icon === 'fa-dollar-sign');
    return budgetBadge?.label || '$1000'; // Default fallback
  }

  getHighlights(): string[] {
    if (!this.data?.itineraryDays) return [];

    // Extract key highlights from the first step of each day
    // Limit to 5 highlights maximum
    return this.data.itineraryDays
      .slice(0, 5)
      .map((day: any, index: number) => {
        const step = day.steps[0] || '';
        // Clean up the step text
        return step.replace(/^\s*\*?\s*(Morning|Afternoon|Evening):\s*/i, '')
                  .split('.')[0] + '.';
      });
  }

  getBudgetBreakdown(): BudgetItem[] {
    // This would ideally come from the trip data
    // For now, we'll create a sample breakdown based on the total budget
    const totalBudget = this.getTotalBudget();
    const numericBudget = parseInt(totalBudget.replace(/[^0-9]/g, '')) || 1000;

    return [
      {
        category: 'Transportation',
        amount: '$' + Math.round(numericBudget * 0.2),
        description: 'flights, shuttles, and taxis',
        icon: 'fa-car',
        class: 'transportation-icon'
      },
      {
        category: 'Accommodation',
        amount: '$' + Math.round(numericBudget * 0.4),
        description: 'hostels and hotels',
        icon: 'fa-bed',
        class: 'accommodation-icon'
      },
      {
        category: 'Food and drink',
        amount: '$' + Math.round(numericBudget * 0.2),
        description: 'local cuisine and snacks',
        icon: 'fa-utensils',
        class: 'food-icon'
      },
      {
        category: 'Activities',
        amount: '$' + Math.round(numericBudget * 0.15),
        description: 'tours and experiences',
        icon: 'fa-hiking',
        class: 'activities-icon'
      },
      {
        category: 'Miscellaneous',
        amount: '$' + Math.round(numericBudget * 0.05),
        description: 'souvenirs and incidentals',
        icon: 'fa-shopping-bag',
        class: 'misc-icon'
      }
    ];
  }

  getPersonalizationHint(): string {
    if (!this.data?.badges) return '';

    const interests = this.data.badges
      .filter((b: Badge) => !['fa-dollar-sign', 'fa-calendar-alt'].includes(b.icon))
      .map((b: Badge) => b.label);

    return interests.length > 0
      ? `Generated for your interests: ${interests.join(', ')}`
      : '';
  }

  getRecommendationText(): string {
    if (this.data?.extracted_info?.recommendation) {
      return this.data.extracted_info.recommendation;
    }
    return this.getTripOverview();
  }

  // Method to close the dialog
  closeDialog(): void {
    this.dialogRef.close();
  }

  // Method to handle tab changes
  onTabChange(event: any) {
    console.log('Tab changed to index:', event.index);
    if (event.index === 2) { // Map tab index
      this.initMap();
    }
  }

  // Method to determine the CSS class for each itinerary step
  getStepClass(step: string): string {
    const step_lower = step.toLowerCase();

    if (step_lower.includes('morning') || step_lower.includes('breakfast')) {
      return 'morning-activity';
    } else if (step_lower.includes('afternoon') || step_lower.includes('lunch')) {
      return 'afternoon-activity';
    } else if (step_lower.includes('evening') || step_lower.includes('dinner')) {
      return 'evening-activity';
    } else if (step_lower.includes('hotel') || step_lower.includes('stay') || step_lower.includes('accommodation')) {
      return 'accommodation';
    } else if (step_lower.includes('drive') || step_lower.includes('taxi') || step_lower.includes('bus') || step_lower.includes('train')) {
      return 'transportation';
    } else if (step_lower.includes('restaurant') || step_lower.includes('eat') || step_lower.includes('food')) {
      return 'dining';
    } else if (step_lower.includes('hike') || step_lower.includes('trek') || step_lower.includes('walk')) {
      return 'hiking';
    } else if (step_lower.includes('swim') || step_lower.includes('beach') || step_lower.includes('boat')) {
      return 'water-activity';
    } else if (step_lower.includes('adventure') || step_lower.includes('explore')) {
      return 'adventure';
    } else if (step_lower.includes('museum') || step_lower.includes('temple') || step_lower.includes('history')) {
      return 'cultural';
    }

    return '';
  }

  // Improved map initialization
  initMap() {
    console.log('Initializing map...');

    // If map is already initialized, just return
    if (this.mapInitialized) {
      console.log('Map already initialized');
      return;
    }

    // Add a small delay to ensure the DOM is ready
    setTimeout(() => {
      const mapContainer = document.getElementById('map-container');
      if (!mapContainer) {
        console.error('Map container not found');
        return;
      }

      console.log('Map container found, creating map');

      // Import Leaflet dynamically
      import('leaflet').then(L => {
        // Create the map with better default zoom
        this.map = L.map('map-container').setView([20, 0], 2);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        // Mark as initialized
        this.mapInitialized = true;

        // Add markers for locations
        this.addMarkersToMap(L);

        // Force a resize to ensure the map renders correctly
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      });
    }, 300);
  }

  // Add markers to the map with improved styling
  async addMarkersToMap(L: any) {
    console.log('Adding markers to map, markers:', this.mapMarkers);

    // Create custom icon for better visibility
    const customIcon = L.icon({
      iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // If no markers, just show the main destination
    if (!this.mapMarkers || this.mapMarkers.length === 0) {
      console.log('No markers, showing main destination:', this.data.destinationName);
      const coords = await this.geocodeDestination(this.data.destinationName);
      if (coords) {
        this.map.setView(coords, 8);
        L.marker(coords, { icon: customIcon }).addTo(this.map)
          .bindPopup(`<b>${this.data.destinationName}</b>`)
          .openPopup();
      }
      return;
    }

    // Create bounds to fit all markers
    const bounds = L.latLngBounds([]);
    const markerCoords: [number, number][] = [];
    const markers: any[] = [];

    // Add markers for all locations
    for (const location of this.mapMarkers) {
      console.log('Geocoding location:', location.name);
      const coords = await this.geocodeDestination(location.name);
      if (coords) {
        console.log('Adding marker for:', location.name, 'at', coords);

        // Create popup content with better formatting
        const popupContent = `
          <div style="max-width: 200px;">
            <h3 style="margin: 0 0 5px 0; color: #2c3e50;">Day ${location.day}</h3>
            <h4 style="margin: 0 0 10px 0; color: #3498db;">${location.name}</h4>
            <p style="margin: 0; font-size: 12px;">${location.description}</p>
          </div>
        `;

        // Add marker with custom icon
        const marker = L.marker(coords, { icon: customIcon }).addTo(this.map)
          .bindPopup(popupContent);

        markers.push(marker);
        markerCoords.push(coords);
        bounds.extend(coords);
      }
    }

    // Add a polyline connecting the destinations in order
    if (markerCoords.length > 1) {
      L.polyline(markerCoords, {
        color: '#3498db',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10'
      }).addTo(this.map);
    }

    // Fit map to show all markers with padding
    if (bounds.isValid()) {
      console.log('Setting bounds to fit all markers');
      this.map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Fallback to main destination
      console.log('No valid bounds, falling back to main destination');
      const coords = await this.geocodeDestination(this.data.destinationName);
      if (coords) {
        this.map.setView(coords, 8);
      }
    }
  }

  // Add this method for encoding URIs in the template
  encodeURI(text: string): string {
    return encodeURIComponent(text);
  }
}
