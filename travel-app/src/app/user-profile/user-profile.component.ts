import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../navbar/navbar.component";
import { PostService } from '../services/post.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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

  // Sample trips data - keep these for now
  trips = [
    { id: 1, destination: 'Paris, France', startDate: '2023-10-10', endDate: '2023-10-17', status: 'Completed' },
    { id: 2, destination: 'Bali, Indonesia', startDate: '2023-09-15', endDate: '2023-09-25', status: 'Completed' },
    { id: 3, destination: 'Swiss Alps', startDate: '2023-08-01', endDate: '2023-08-10', status: 'Completed' },
    { id: 4, destination: 'Tokyo, Japan', startDate: '2023-12-15', endDate: '2023-12-25', status: 'Upcoming' }
  ];

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    // Load posts directly from API
    this.loadUserPosts();
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
                post.userPhoto = post.userPhoto || this.user.photoUrl;
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

  setActiveTab(tab: string) {
    this.activeTab = tab;

    // Reload posts when switching to posts tab
    if (tab === 'posts') {
      this.loadUserPosts();
    }
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
