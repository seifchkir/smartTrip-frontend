import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  user: any = {};
  isLoading = true;
  error = '';

  // Placeholder for future posts
  posts = [
    { id: 1, placeholder: true },
    { id: 2, placeholder: true },
    { id: 3, placeholder: true }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading = true;
    this.error = '';

    // Get user email from localStorage
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
        console.log('User profile loaded:', userData);
      },
      error: (err) => {
        this.error = 'Failed to load user profile: ' + (err.error?.message || err.message || 'Unknown error');
        this.isLoading = false;
        console.error('Error loading user profile:', err);
      }
    });
  }
}
