import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FormsModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  destinations = [
    {
      name: 'Santorini, Greece',
      description: 'Experience the magic of white-washed buildings and stunning sunsets',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      likes: 1245,
      comments: 89,
      userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      userName: 'Sarah Johnson'
    },
    {
      name: 'Kyoto, Japan',
      description: 'Discover ancient temples and beautiful cherry blossoms',
      image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      likes: 987,
      comments: 67,
      userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      userName: 'Michael Chen'
    },
    {
      name: 'Bali, Indonesia',
      description: 'Tropical paradise with rich culture and beautiful beaches',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      likes: 1567,
      comments: 112,
      userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      userName: 'Emma Wilson'
    }
  ];

  testimonials = [
    {
      text: 'This app completely changed how I plan my trips. The community is amazing and the AI trip planner is spot on!',
      name: 'David Miller',
      location: 'New York, USA',
      avatar: 'https://randomuser.me/api/portraits/men/75.jpg'
    },
    {
      text: 'I\'ve discovered so many hidden gems through this platform. The travel stories are inspiring and helpful!',
      name: 'Sophia Lee',
      location: 'London, UK',
      avatar: 'https://randomuser.me/api/portraits/women/33.jpg'
    },
    {
      text: 'The trip planning feature saved me so much time. I got a perfect itinerary for my Japan trip!',
      name: 'Carlos Rodriguez',
      location: 'Madrid, Spain',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg'
    }
  ];

  // New properties for trip planning
  tripQuery: string = '';
  tripPlan: any = null;
  isLoading: boolean = false;
  error: string | null = null;

  // New UI properties
  itineraryDays: any[] = [];
  destinationName: string = '';
  badges: { label: string, icon: string, color: string }[] = [];
  destinationImage: string = '';

  constructor(private http: HttpClient) {}

  // Method to analyze trip query
  async analyzeTripQuery() {
    if (!this.tripQuery.trim()) {
      this.error = 'Please enter a trip query';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.tripPlan = null;
    this.itineraryDays = [];
    this.destinationName = '';
    this.badges = [];
    this.destinationImage = '';

    try {
      const response = await this.http.post('http://localhost:8000/api/analyze-trip', {
        query: this.tripQuery
      }).toPromise();

      console.log('Trip plan response:', response);

      if (response) {
        this.tripPlan = response;
        this.parseTripPlan();
      } else {
        this.error = 'Received empty response from server';
      }

      this.isLoading = false;
    } catch (error) {
      console.error('Error analyzing trip:', error);
      this.error = 'Failed to analyze trip. Please try again.';
      this.isLoading = false;
    }
  }

  parseTripPlan() {
    if (!this.tripPlan) return;
    // Extract destination name from recommendation or extracted_info
    if (this.tripPlan.extracted_info && this.tripPlan.extracted_info.location) {
      this.destinationName = this.capitalize(this.tripPlan.extracted_info.location);
    } else {
      this.destinationName = 'Your Destination';
    }
    // Get a static Unsplash image for the destination
    this.destinationImage = this.getDestinationImage(this.destinationName);
    // Prepare badges
    const info = this.tripPlan.extracted_info || {};
    this.badges = [];
    if (info.duration) this.badges.push({ label: info.duration, icon: 'fa-clock', color: '#4dabf7' });
    if (info.budget) this.badges.push({ label: info.budget, icon: 'fa-dollar-sign', color: '#43a047' });
    if (info.theme) this.badges.push({ label: this.capitalize(info.theme), icon: 'fa-leaf', color: '#e91e63' });
    if (info.location) this.badges.push({ label: this.capitalize(info.location), icon: 'fa-map-marker-alt', color: '#ff9800' });
    if (info.additional_preferences) this.badges.push({ label: this.capitalize(info.additional_preferences), icon: 'fa-star', color: '#ffb300' });
    // Parse itinerary from recommendation (if present)
    this.itineraryDays = this.parseItinerary(this.tripPlan.recommendation || '');
  }

  parseItinerary(recommendation: string) {
    console.log('Raw Recommendation String:', recommendation);
    const days: any[] = [];

    // Check if we have a structured response or plain text
    if (typeof recommendation !== 'string') {
      console.log('Non-string recommendation received:', recommendation);
      return days;
    }

    // Try to find day patterns in the text
    const dayPatterns = [
      /\*\*Day (\d+)[:\s]+(.*?)\*\*/gi,  // **Day X: Title**
      /Day (\d+)[:\s]+(.*?)(?:\n|$)/gi,  // Day X: Title
      /\*Day (\d+)[:\s]+(.*?)\*/gi,      // *Day X: Title*
      /\\n\\nDay (\d+)[:\s]+(.*?)\\n/gi  // \n\nDay X: Title\n
    ];

    let foundDays = false;

    // Try each pattern until we find matches
    for (const pattern of dayPatterns) {
      const matches = [...recommendation.matchAll(pattern)];
      if (matches.length > 0) {
        foundDays = true;

        // Extract day positions to split content
        const dayPositions = matches.map(match => ({
          dayNum: parseInt(match[1]),
          title: match[0],
          index: match.index
        }));

        // Add end position
        dayPositions.push({
          dayNum: 999,
          title: 'END',
          index: recommendation.length
        });

        // Extract content between day markers
        for (let i = 0; i < dayPositions.length - 1; i++) {
          const current = dayPositions[i];
          const next = dayPositions[i + 1];

          const startIdx = current.index + current.title.length;
          const endIdx = next.index;
          const content = recommendation.substring(startIdx, endIdx).trim();

          // Split content into steps
          const steps = content
            .split(/\n\s*[•\-*]\s*|\n(?=\S)/)
            .map(s => s.trim())
            .filter(s => s && s.length > 0);

          days.push({
            title: `Day ${current.dayNum}`,
            steps: steps
          });
        }

        break; // Stop after finding matches with one pattern
      }
    }

    // If no day patterns found, try to split by "Day X" mentions in text
    if (!foundDays) {
      const simpleDayPattern = /\b(Day\s+\d+)\b/g;
      const dayMatches = [...recommendation.matchAll(simpleDayPattern)];

      if (dayMatches.length > 0) {
        foundDays = true;

        // Extract day positions
        const dayPositions = dayMatches.map(match => ({
          title: match[0],
          index: match.index
        }));

        // Add end position
        dayPositions.push({
          title: 'END',
          index: recommendation.length
        });

        // Extract content between day markers
        for (let i = 0; i < dayPositions.length - 1; i++) {
          const current = dayPositions[i];
          const next = dayPositions[i + 1];

          const content = recommendation.substring(current.index, next.index).trim();

          // Split content into steps
          const steps = content
            .split(/\n/)
            .map(s => s.trim())
            .filter(s => s && s.length > 0);

          days.push({
            title: current.title,
            steps: steps
          });
        }
      }
    }

    // If still no days found, treat the whole text as one section
    if (!foundDays && recommendation.trim() !== '') {
      const steps = recommendation
        .split(/\n/)
        .map(s => s.trim())
        .filter(s => s && s.length > 0);

      days.push({
        title: 'Trip Details',
        steps: steps
      });
    }

    console.log('Parsed days:', days);
    return days;
  }

  capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getDestinationImage(destination: string): string {
    // Use Unsplash for demo
    return `https://source.unsplash.com/800x300/?${encodeURIComponent(destination)},travel`;
  }

  getStepClass(step: string): string {
    const lowerStep = step.toLowerCase();

    if (lowerStep.includes('morning')) return 'morning-activity';
    if (lowerStep.includes('afternoon')) return 'afternoon-activity';
    if (lowerStep.includes('evening')) return 'evening-activity';

    if (lowerStep.includes('taxi') || lowerStep.includes('shuttle') ||
        lowerStep.includes('bus') || lowerStep.includes('car'))
      return 'transportation';

    if (lowerStep.includes('accommodation') || lowerStep.includes('hotel') ||
        lowerStep.includes('resort') || lowerStep.includes('night'))
      return 'accommodation';

    if (lowerStep.includes('restaurant') || lowerStep.includes('dinner') ||
        lowerStep.includes('lunch') || lowerStep.includes('breakfast') ||
        lowerStep.includes('cuisine'))
      return 'dining';

    if (lowerStep.includes('hike') || lowerStep.includes('hiking') ||
        lowerStep.includes('trail') || lowerStep.includes('mountain') ||
        lowerStep.includes('forest'))
      return 'hiking';

    if (lowerStep.includes('beach') || lowerStep.includes('swim') ||
        lowerStep.includes('snorkel') || lowerStep.includes('ocean') ||
        lowerStep.includes('sea'))
      return 'water-activity';

    if (lowerStep.includes('zip-lining') || lowerStep.includes('adventure') ||
        lowerStep.includes('canopy'))
      return 'adventure';

    if (lowerStep.includes('museum') || lowerStep.includes('cultural') ||
        lowerStep.includes('heritage'))
      return 'cultural';

    return '';
  }
}
