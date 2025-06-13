import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { tripService } from './trip.service'; // Import the tripService instance

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
    HttpClientModule,
    FormsModule
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

  // Add new properties
  tripTitle: string = '';
  isSaving: boolean = false;
  saveError: string | null = null;
  saveSuccess: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<TripDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // When data comes from a SavedTrip, rawRecommendationString might be the full markdown.
    // When data comes from new generation, tripOverviewText is generated here.
    // Let's ensure tripOverviewText is set, prioritizing a passed-in title or generated overview.
    this.tripOverviewText = this.data.title || this.getTripOverview();

    console.log('Dialog data on init:', this.data);

    console.log('Detailed Budget data:', this.data?.detailedBudget);
    console.log('Budget Breakdown array:', this.getBudgetBreakdown());

    // Location extraction will be called when the map tab is initialized.

    // Initialize map if the map tab is initially active (less common) or when map tab is selected.
    // The initMap call is already in onTabChange.
  }

  // Extract locations from the itinerary with improved filtering
  extractLocationsFromItinerary() {
    console.log('extractLocationsFromItinerary: Called');
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
        // First check for explicit location markers
        if (step.includes('📍 Location(s):')) {
          const locationPart = step.split('📍 Location(s):')[1].trim();
          const locationNames = locationPart.split(',').map(loc => loc.trim());

          locationNames.forEach(locationName => {
            if (locationName && !locations.some(loc => loc.name.toLowerCase() === locationName.toLowerCase())) {
              locations.push({
                name: locationName,
                day: dayIndex + 1,
                description: `Day ${dayIndex + 1}: ${day.title}`
              });
            }
          });
        }

        // Then look for location mentions in activities
        if (step.includes('🗓️ Activities:')) {
          const activityLines = step.split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(1).trim());

          activityLines.forEach(activity => {
            // Look for common location indicators
            const locationIndicators = [
              'at', 'in', 'to', 'visit', 'explore', 'see', 'tour',
              'along', 'through', 'near', 'around'
            ];

            locationIndicators.forEach(indicator => {
              const regex = new RegExp(`${indicator}\\s+([A-Z][a-zA-Z\\s-]+?)(?:,|\\.|$)`, 'g');
              let match;
              while ((match = regex.exec(activity)) !== null) {
                const locationName = match[1].trim();
                // Skip if it's too short or contains common non-location words
                if (locationName.length < 3 ||
                    /morning|afternoon|evening|breakfast|lunch|dinner|hotel|day|time/i.test(locationName)) {
              continue;
            }

          if (!locations.some(loc => loc.name.toLowerCase() === locationName.toLowerCase())) {
            locations.push({
              name: locationName,
              day: dayIndex + 1,
                    description: activity
            });
          }
              }
            });
        });
        }
      });
    });

    console.log('Extracted locations:', locations);
    this.mapMarkers = locations;
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

  // Modify getTripOverview to be a fallback or to display a simple intro based on available data
  getTripOverview(): string {
    if (this.data?.rawRecommendationString) {
      // If raw markdown is available, use the beginning of it as an overview or indicate it's detailed.
      return this.data.rawRecommendationString.substring(0, 200) + '...'; // Display snippet
    } else if (this.data?.title) {
        return `Details for your trip to ${this.data.destinationName || this.data.title}.`;
    }
    return 'Detailed trip information.';
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

  // Modify getHighlights to use the highlights array from the data
  getHighlights(): string[] {
    // Directly use the highlights array passed in the data
    if (this.data?.highlights && Array.isArray(this.data.highlights)) {
        return this.data.highlights;
    }
     // Fallback to the old logic if highlights array is not available (e.g., from new generation)
    if (!this.data?.itineraryDays) return [];

    // Extract key highlights from the first step of each day
    // Limit to 5 highlights maximum
    return this.data.itineraryDays
      .slice(0, 5)
      .map((day: any, index: number) => {
        // Check if day.steps exists and has at least one element
        const step = (day.steps && day.steps.length > 0) ? day.steps[0] : '';
        // Clean up the step text
        return step.replace(/^\s*\*?\s*(Morning|Afternoon|Evening):\s*/i, '')
                  .split('.')[0] + '.';
      });
  }

  // Modify getBudgetBreakdown to use the detailedBudget object from the data
  getBudgetBreakdown(): BudgetItem[] {
    // Use the detailedBudget object passed in the data
    if (this.data?.detailedBudget) {
        const breakdown: BudgetItem[] = [];
        // Map the detailedBudget object to the BudgetItem array format expected by the template
        for (const category in this.data.detailedBudget) {
            if (this.data.detailedBudget.hasOwnProperty(category)) {
                breakdown.push({
                    category: category,
                    amount: '$' + this.data.detailedBudget[category],
                    description: '', // Description might not be available in saved data
                    icon: this.getBudgetIcon(category), // Helper to get icon based on category
                    class: this.getBudgetIconClass(category) // Helper to get class based on category
                });
            }
        }
         // Add a total if it exists in the detailedBudget
        if (this.data.detailedBudget.hasOwnProperty('Total')) {
             // Find the total item and move it to the end or style it differently
             const totalItemIndex = breakdown.findIndex(item => item.category === 'Total');
             if (totalItemIndex > -1) {
                 const [totalItem] = breakdown.splice(totalItemIndex, 1);
                 breakdown.push({...totalItem, class: 'total-icon'}); // Add total class for styling
             }
        }
        return breakdown;
    }

    // Fallback to the old logic if detailedBudget is not available
    const totalBudget = this.getTotalBudget(); // This will use the budget badge if available
    const numericBudget = parseInt(totalBudget.replace(/[^0-9]/g, '')) || 1000;

    return [
      {
        category: 'Transportation',
        amount: '$' + Math.round(numericBudget * 0.2),
        description: 'flights, shuttles, and taxis',
        icon: 'fa-car',
        class: 'transportation-icon'
      },
      // ... rest of old hardcoded budget items ...
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
      },
      { // Add a calculated total for the fallback
        category: 'Total',
        amount: totalBudget,
        description: 'Estimated total budget',
        icon: 'fa-dollar-sign',
        class: 'total-icon'
      }
    ];
  }

  // Helper to get budget icon based on category name (for saved data)
  private getBudgetIcon(category: string): string {
      const cleanedCategory = category.replace(/^[-\s*]+|:\s*$/g, '').trim(); // Remove leading -, *, spaces, and trailing :
      switch (cleanedCategory) {
          case 'Transportation': return 'fa-car';
          case 'Accommodation': return 'fa-bed';
          case 'Food and supplies': return 'fa-utensils';
          case 'Activities': return 'fa-hiking';
          case 'Miscellaneous': return 'fa-shopping-bag';
          case 'Total': return 'fa-dollar-sign';
          case 'Permits and fees': return 'fa-scroll'; // Added icon for Permits and fees
          default: return '';
      }
  }

    // Helper to get budget icon class based on category name (for saved data)
  private getBudgetIconClass(category: string): string {
      const cleanedCategory = category.replace(/^[-\s*]+|:\s*$/g, '').trim(); // Remove leading -, *, spaces, and trailing :
      switch (cleanedCategory) {
          case 'Transportation': return 'transportation-icon';
          case 'Accommodation': return 'accommodation-icon';
          case 'Food and supplies': return 'food-icon';
          case 'Activities': return 'activities-icon';
          case 'Miscellaneous': return 'misc-icon';
          case 'Total': return 'total-icon';
          case 'Permits and fees': return 'permits-icon'; // Added class for Permits and fees
          default: return '';
      }
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

  getOverviewParagraph(): string {
    if (!this.data?.rawRecommendationString) {
      return this.getTripOverview();
    }
    const paragraphs = this.data.rawRecommendationString.split('\n\n');
    return paragraphs[0] || this.getTripOverview(); // Return the first paragraph or fallback
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
    // Add a check if step is a string before processing
    if (typeof step !== 'string' || !step) {
        return ''; // Return empty string if step is not a valid string
    }
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
        console.log('initMap (promise): Calling extractLocationsFromItinerary...');
        this.extractLocationsFromItinerary();
        console.log('initMap (promise): After extractLocationsFromItinerary, mapMarkers:', this.mapMarkers);
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
    console.log('addMarkersToMap: Called at start, current mapMarkers:', this.mapMarkers);

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

  // Method to handle saving using the service
  async saveTrip() {
    // Clear previous messages
    this.saveError = null;
    this.saveSuccess = false;

    // Validate title on the frontend before calling the service (service also validates)
    if (!this.tripTitle || !this.tripTitle.trim()) {
      this.saveError = 'Please enter a title for your trip';
      return;
    }

    this.isSaving = true;

    // Use the raw recommendation string from data for saving
    const markdownRecForSave = this.data.rawRecommendationString;

    if (!markdownRecForSave) {
        console.error('saveTrip: rawRecommendationString is missing from dialog data.', this.data);
         this.saveError = 'Cannot save trip: Recommendation data is missing.';
         this.isSaving = false;
         return;
    }

    const originalQ = this.data.originalQuery; // Assuming this is correctly populated
    const title = this.tripTitle;

    console.log('Data being sent to TripService.saveTrip:', {
      markdownRecommendation: markdownRecForSave,
      originalQuery: originalQ,
      title: title
    });

    try {
      // Call the saveTrip method from the imported tripService instance
      const response = await tripService.saveTrip(
        markdownRecForSave, // Use the dedicated variable
        originalQ, // originalQuery
        title // title
      );

      this.saveSuccess = true;
      console.log('Trip saved successfully:', response);
      // Optionally, display the saved_trip_id or other response data
    } catch (error: any) {
      console.error('Error saving trip:', error);
      // The service throws errors with user-friendly messages
      this.saveError = error.message || 'Failed to save trip. Please try again.';
    } finally {
      this.isSaving = false;
    }
  }
}
