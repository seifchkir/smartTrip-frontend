import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TripDetailsDialogComponent } from '../trip-details-dialog/trip-details-dialog.component';
import { TripParsingService, ParsedTripPlan } from '../trip-details-dialog/trip-parsing.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatbotService } from '../shared/services/chatbot.service';
import { ChatbotModule } from '../shared/components/chatbot/chatbot.module';

interface Badge {
  icon: string;
  label: string;
  color?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FormsModule,
    HttpClientModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ChatbotModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  destinations = [
    {
      name: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Santorini, Greece',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Paris, France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'New York, USA',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Barcelona, Spain',
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
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
  parsedTripPlan: ParsedTripPlan | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  tripPlan: ParsedTripPlan | null = null;
  badges: Badge[] = [];
  destinationImage: string = '';
  destinationName: string = '';
  itineraryDays: any[] = [];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private tripParsingService: TripParsingService,
    private chatbotService: ChatbotService
  ) {}

  ngOnInit() {
    // Initialize any required data
  }

  // Method to analyze trip query
  async analyzeTripQuery() {
    if (!this.tripQuery.trim()) {
      this.error = 'Please enter a trip query';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.tripPlan = null;

    try {
      const response = await fetch('http://localhost:8000/api/analyze-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: this.tripQuery }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze trip query');
      }

      const data = await response.json();

      // Parse the raw recommendation using the TripParsingService
      const parsedData = this.tripParsingService.parseRawRecommendation(
        data.recommendation,
        this.tripQuery,
        data.title || 'My Trip'
      );

      // Update component properties with parsed data
      this.tripPlan = parsedData;
      this.destinationName = parsedData.destinationName || '';
      this.itineraryDays = parsedData.itineraryDays || [];

      // Generate badges based on the parsed data
      this.generateBadges(parsedData);

      // Open the trip details dialog with the parsed data
      this.openTripDetailsDialog(parsedData);

    } catch (error: any) {
      console.error('Error analyzing trip query:', error);
      this.error = error.message || 'An error occurred while analyzing your trip query';
    } finally {
      this.isLoading = false;
    }
  }

  private generateBadges(parsedData: ParsedTripPlan) {
    this.badges = [];

    // Add budget badge if available
    if (parsedData.detailedBudget?.['Total']) {
      this.badges.push({
        icon: 'fa-dollar-sign',
        label: `$${parsedData.detailedBudget['Total']}`,
        color: '#4CAF50'
      });
    }

    // Add duration badge
    if (parsedData.itineraryDays?.length) {
      this.badges.push({
        icon: 'fa-calendar-alt',
        label: `${parsedData.itineraryDays.length} days`,
        color: '#2196F3'
      });
    }

    // Add activity badges based on itinerary content
    const activities = new Set<string>();
    parsedData.itineraryDays?.forEach(day => {
      day.steps?.forEach(step => {
        const stepClass = this.getStepClass(step);
        if (stepClass) {
          activities.add(stepClass);
        }
      });
    });

    // Map activity types to icons
    const activityIcons: { [key: string]: string } = {
      'hiking': 'fa-hiking',
      'water-activity': 'fa-umbrella-beach',
      'cultural': 'fa-landmark',
      'adventure': 'fa-mountain',
      'dining': 'fa-utensils'
    };

    activities.forEach(activity => {
      if (activityIcons[activity]) {
        this.badges.push({
          icon: activityIcons[activity],
          label: activity.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          color: '#FF9800'
        });
      }
    });
  }

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

  openTripDetailsDialog(parsedData: ParsedTripPlan) {
    this.dialog.open(TripDetailsDialogComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'full-screen-dialog',
      data: parsedData
    });
  }

  openChatbot() {
    this.chatbotService.openChatbot();
  }
}
