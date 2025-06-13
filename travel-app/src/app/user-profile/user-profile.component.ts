import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../navbar/navbar.component";
import { PostService } from '../services/post.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { tripService, SavedTrip } from '../trip-details-dialog/trip.service';
import { TripDetailsDialogComponent } from '../trip-details-dialog/trip-details-dialog.component';
import { TripParsingService, ParsedTripPlan } from '../trip-details-dialog/trip-parsing.service';

interface Badge {
  icon: string;
  label: string;
  color?: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, MatTabsModule, MatProgressSpinnerModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  user: any = {};
  isLoading = true;
  error = '';
  activeTab: number = 0; // 0 for Posts, 1 for Trips, 2 for Photos, 3 for About
  isEditing = false;
  editableUser: any = {};

  // Posts data - will be populated from API
  posts: any[] = [];

  // Sample photos data - keep these for now
  photos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop', caption: 'Paris' },
    { id: 2, url: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?q=80&w=1935&auto=format&fit=crop', caption: 'Bali Beach' },
    { id: 3, url: 'https://images.unsplash.com/photo-1527254432234-a36e2741258a?q=80&w=1974&auto=format&fit=crop', caption: 'Swiss Alps' },
    { id: 4, url: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?q=80&w=2070&auto=format&fit=crop', caption: 'Venice' },
    { id: 5, url: 'https://images.unsplash.com/photo-1504019347908-b45f9b0b8dd5?q=80&w=2071&auto=format&fit=crop', caption: 'New York' },
    { id: 6, url: 'https://images.unsplash.com/photo-1528702748617-c64d49f918af?q=80&w=1974&auto=format&fit=crop', caption: 'Tokyo' }
  ];

  // Sample trips data - keep these for now (no longer strictly needed if using savedTrips)
  // trips = [
  //   { id: 1, destination: 'Paris, France', startDate: '2023-10-10', endDate: '2023-10-17', status: 'Completed' },
  //   // ... other sample trips ...
  // ];

  savedTrips: SavedTrip[] = [];
  isLoadingTrips = false;
  tripsError: string | null = null;
  userId: string | null = null;

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private http: HttpClient,
    private dialog: MatDialog,
    private tripParsingService: TripParsingService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    // Load posts initially
    this.loadUserPosts();
    this.userId = this.getUserIdFromLocalStorage();
    if (this.userId) {
      this.loadSavedTrips();
    } else {
      this.tripsError = 'User not logged in.';
    }
  }

  // Improved loadUserPosts method
  loadUserPosts() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.error('No authentication token found');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Clear existing posts before loading new ones
    this.posts = [];

    this.http.get<any>('http://localhost:8080/api/social/user/posts', { headers })
      .subscribe({
        next: (response) => {
          console.log('User posts loaded successfully:', response);

          // Convert the response object to an array of posts
          const postsArray = [];

          // Process the response
          if (response && typeof response === 'object') {
            for (const key in response) {
              if (response.hasOwnProperty(key) && typeof response[key] === 'object') {
                const post = response[key];
                post.id = key; // Add the document ID as post.id

                // Set default values for missing fields
                post.userName = post.userName || (this.user.firstName + ' ' + this.user.lastName);

                // Use user's photoUrl instead of placeholder
                post.userPhoto = post.userPhoto || this.user.photoUrl;

                // If post image is a placeholder, use user's photo instead
                if (!post.imageUrl || post.imageUrl.includes('placeholder.com')) {
                  post.imageUrl = this.user.photoUrl || 'assets/images/default-post.jpg';
                }

                post.title = post.title || 'My Travel Experience';
                post.likes = post.likes || 0;
                post.comments = post.comments || 0;

                postsArray.push(post);
              }
            }
          }

          // Sort posts by creation date (newest first)
          postsArray.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          this.posts = postsArray;
          console.log('Processed posts:', this.posts);
        },
        error: (error) => {
          console.error('Error loading user posts:', error);
        }
      });
  }

  loadUserProfile() {
    this.isLoading = true;
    this.error = '';

    // Get user profile from localStorage
    const userProfileStr = localStorage.getItem('userProfile');

    if (userProfileStr) {
      try {
        this.user = JSON.parse(userProfileStr);
        this.isLoading = false;
        console.log('User profile loaded from localStorage:', this.user);
        return;
      } catch (e) {
        console.error('Error parsing user profile from localStorage:', e);
      }
    }

    // Fallback to getting user by email if localStorage doesn't have profile
    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
      this.error = 'User not found. Please log in again.';
      this.isLoading = false;
      return;
    }

    // Fetch user profile using email
    this.authService.getUserByEmail(userEmail).subscribe({
      next: (userData) => {
        this.user = userData;
        this.isLoading = false;
        console.log('User profile loaded from API:', userData);
      },
      error: (err) => {
        this.error = 'Failed to load user profile: ' + (err.error?.message || err.message || 'Unknown error');
        this.isLoading = false;
        console.error('Error loading user profile:', err);

        // For demo purposes, create a sample user
        this.user = {
          firstName: 'John',
          lastName: 'Doe',
          email: userEmail,
          photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
          bio: 'Travel enthusiast and photographer. Always looking for the next adventure!',
          location: 'New York, USA',
          joinedDate: '2023-01-15'
        };
      }
    });
  }

  setActiveTab(event: any) {
    this.activeTab = event.index;

    // Reload data based on tab index if necessary
    // 0: Posts, 1: Trips, 2: Photos, 3: About
    if (this.activeTab === 0) { // Posts tab
      this.loadUserPosts();
    } else if (this.activeTab === 1) { // Trips tab
        // Trips are loaded in ngOnInit, might need reload logic here if filtering/sorting is added
        if (this.userId && this.savedTrips.length === 0 && !this.isLoadingTrips && !this.tripsError) {
            this.loadSavedTrips(); // Load if not already loaded and no error occurred
        }
    }
     // Add logic for other tabs if needed
  }

  startEditing() {
    this.editableUser = { ...this.user };
    this.isEditing = true;
  }

  cancelEditing() {
    this.isEditing = false;
  }

  saveProfile() {
    this.isLoading = true;

    // In a real app, you would call an API to update the profile
    // For now, we'll just update the local state
    setTimeout(() => {
      this.user = { ...this.editableUser };
      localStorage.setItem('userProfile', JSON.stringify(this.user));
      this.isEditing = false;
      this.isLoading = false;
    }, 1000);
  }

  // Helper method to get user ID from local storage (can be moved to service if preferred)
  private getUserIdFromLocalStorage(): string | null {
     const userProfileString = localStorage.getItem('userProfile');
     if (!userProfileString) {
         console.warn('getUserIdFromLocalStorage (UserProfile): userProfile not found in localStorage');
         // Try to get from auth_token as fallback
         const authToken = localStorage.getItem('auth_token');
         if (authToken) {
             try {
                 const payload = JSON.parse(atob(authToken.split('.')[1]));
                 const userIdFromToken = payload.sub || payload.userId || payload.email;
                 if (userIdFromToken) {
                     console.log('Using user ID from auth_token (UserProfile fallback):', userIdFromToken);
                     return userIdFromToken;
                 }
             } catch (error) {
                 console.error('Error parsing auth_token (UserProfile fallback):', error);
             }
         }
         return null;
     }

     try {
         const userProfile = JSON.parse(userProfileString);
         if (userProfile?.id) {
             console.log('Using userProfile.id as userId (UserProfile):', userProfile.id);
             return userProfile.id;
         } else if (userProfile?.userId) {
            console.log('Using userProfile.userId as userId (UserProfile fallback):', userProfile.userId);
            return userProfile.userId;
         } else if (userProfile?.email) {
            console.log('Using userProfile.email as userId (UserProfile fallback):', userProfile.email);
            return userProfile.email;
         }
         console.warn('userProfile found (UserProfile), but no id, userId, or email field', userProfile);
         return null;

     } catch (error) {
         console.error('Error parsing userProfile from localStorage (UserProfile):', error);
         return null;
     }
  }

  // Method to generate badges (copied from home.component.ts)
  private generateBadges(parsedData: ParsedTripPlan) {
    parsedData.badges = [];

    // Add budget badge if available
    if (parsedData.detailedBudget?.['Total']) {
      parsedData.badges.push({
        icon: 'fa-dollar-sign',
        label: `$${parsedData.detailedBudget['Total']}`,
        color: '#4CAF50'
      });
    }

    // Add duration badge
    if (parsedData.itineraryDays?.length) {
      parsedData.badges.push({
        icon: 'fa-calendar-alt',
        label: `${parsedData.itineraryDays.length} days`,
        color: '#2196F3'
      });
    }

    // Add activity badges based on itinerary content
    const activities = new Set<string>();
    parsedData.itineraryDays?.forEach(day => {
      day.steps?.forEach(step => {
        const stepClass = this.getStepClass(step); // Note: Need getStepClass in this component or shared service
        if (stepClass) {
          activities.add(stepClass);
        }
      });
    });

    // Map activity types to icons (copied from home.component.ts)
    const activityIcons: { [key: string]: string } = {
      'hiking': 'fa-hiking',
      'water-activity': 'fa-umbrella-beach',
      'cultural': 'fa-landmark',
      'adventure': 'fa-mountain',
      'dining': 'fa-utensils'
    };

    activities.forEach(activity => {
      if (activityIcons[activity]) {
        parsedData.badges.push({
          icon: activityIcons[activity],
          label: activity.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          color: '#FF9800'
        });
      }
    });
  }

  // Method to determine the CSS class for each itinerary step (copied from home.component.ts)
  getStepClass(step: string): string {
    const step_lower = step.toLowerCase();
    if (step_lower.includes('morning') || step_lower.includes('breakfast')) {
      return 'morning-activity';
    } else if (step_lower.includes('afternoon') || step_lower.includes('lunch')) {
      return 'afternoon-activity';
    } else if (step_lower.includes('evening') || step_lower.includes('dinner')) {
      return 'evening-activity';
    } else if (step_lower.includes('hotel' ) || step_lower.includes('stay') || step_lower.includes('accommodation')) {
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

  async loadSavedTrips(): Promise<void> {
    if (!this.userId) {
        this.tripsError = 'User ID is missing. Cannot load trips.';
        return;
    }

    this.isLoadingTrips = true;
    this.tripsError = null;

    try {
      // Call the getUserTrips method from the imported tripService instance
      this.savedTrips = await tripService.getUserTrips(this.userId);
      console.log('Loaded saved trips:', this.savedTrips);
    } catch (error: any) {
      console.error('Error loading saved trips:', error);
      this.tripsError = error.message || 'Failed to load saved trips. Please try again.';
    } finally {
      this.isLoadingTrips = false;
    }
  }

  // Method to open the trip details dialog for a saved trip
  viewTripDetails(trip: SavedTrip): void {
    console.log('Opening trip details dialog with parsed data from SavedTrip:', trip);
    // Parse the raw recommendation data from the saved trip
    const parsedData: ParsedTripPlan = this.tripParsingService.parseRawRecommendation(
      trip.rawRecommendationData,
      trip.originalQuery,
      trip.title
    );

    // Generate badges for the parsed saved trip data
    this.generateBadges(parsedData);

    // Open the dialog and pass the parsed data
    this.dialog.open(TripDetailsDialogComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'full-screen-dialog',
      data: parsedData // Pass the parsed data object
    });
  }

  // Helper to format date
  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
}
