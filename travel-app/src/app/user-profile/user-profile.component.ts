import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  user: any = {};
  isLoading = true;
  error = '';
  activeTab = 'posts';
  isEditing = false;
  editableUser: any = {};

  // Sample posts data
  posts = [
    {
      id: 1,
      title: 'Amazing Trip to Paris',
      content: 'Just spent a week exploring the beautiful city of Paris. The Eiffel Tower was breathtaking!',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop',
      likes: 24,
      comments: 5,
      date: '2023-10-15'
    },
    {
      id: 2,
      title: 'Beach Vacation in Bali',
      content: 'Crystal clear waters and amazing sunsets. Bali is truly a paradise!',
      image: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?q=80&w=1935&auto=format&fit=crop',
      likes: 42,
      comments: 8,
      date: '2023-09-20'
    },
    {
      id: 3,
      title: 'Hiking in the Swiss Alps',
      content: 'The views were absolutely stunning. Nature at its finest!',
      image: 'https://images.unsplash.com/photo-1527254432234-a36e2741258a?q=80&w=1974&auto=format&fit=crop',
      likes: 18,
      comments: 3,
      date: '2023-08-05'
    }
  ];

  // Sample photos data
  photos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop', caption: 'Paris' },
    { id: 2, url: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?q=80&w=1935&auto=format&fit=crop', caption: 'Bali Beach' },
    { id: 3, url: 'https://images.unsplash.com/photo-1527254432234-a36e2741258a?q=80&w=1974&auto=format&fit=crop', caption: 'Swiss Alps' },
    { id: 4, url: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?q=80&w=2070&auto=format&fit=crop', caption: 'Venice' },
    { id: 5, url: 'https://images.unsplash.com/photo-1504019347908-b45f9b0b8dd5?q=80&w=2071&auto=format&fit=crop', caption: 'New York' },
    { id: 6, url: 'https://images.unsplash.com/photo-1528702748617-c64d49f918af?q=80&w=1974&auto=format&fit=crop', caption: 'Tokyo' }
  ];

  // Sample trips data
  trips = [
    { id: 1, destination: 'Paris, France', startDate: '2023-10-10', endDate: '2023-10-17', status: 'Completed' },
    { id: 2, destination: 'Bali, Indonesia', startDate: '2023-09-15', endDate: '2023-09-25', status: 'Completed' },
    { id: 3, destination: 'Swiss Alps', startDate: '2023-08-01', endDate: '2023-08-10', status: 'Completed' },
    { id: 4, destination: 'Tokyo, Japan', startDate: '2023-12-15', endDate: '2023-12-25', status: 'Upcoming' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUserProfile();
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

  setActiveTab(tab: string) {
    this.activeTab = tab;
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
}
