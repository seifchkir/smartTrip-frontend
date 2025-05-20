import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  userId = '1'; // Default ID
  profilePhotoUrl: string | null = null;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Check if user is logged in
    try {
      const token = localStorage.getItem('auth_token');
      const userEmail = localStorage.getItem('userEmail');

      this.isLoggedIn = !!token || !!userEmail;

      // Try to get user ID from localStorage
      const signupData = localStorage.getItem('signupData');
      if (signupData) {
        const userData = JSON.parse(signupData);
        if (userData && userData.id) {
          this.userId = userData.id;
        }
      }

      // Fetch user photo if logged in
      if (this.isLoggedIn && userEmail) {
        this.getUserDetails(userEmail).subscribe(
          (userData) => {
            const serverUrl = 'http://localhost:8080'; // Change to your backend URL
            let photoUrl = userData.photoUrl;
            // Only set default if photoUrl is missing or empty
            if (!photoUrl || photoUrl.trim() === '') {
              this.profilePhotoUrl = 'assets/images/default-avatar.svg';
            } else if (!photoUrl.startsWith('http') && !photoUrl.startsWith('assets')) {
              this.profilePhotoUrl = serverUrl + photoUrl;
            } else {
              // If using Unsplash or similar, request a smaller image for the navbar
              if (photoUrl.includes('images.unsplash.com')) {
                this.profilePhotoUrl = photoUrl + (photoUrl.includes('?') ? '&' : '?') + 'w=64&h=64&fit=crop';
              } else {
                this.profilePhotoUrl = photoUrl;
              }
            }
          },
          (error) => {
            console.error('Error fetching user details:', error);
            this.profilePhotoUrl = 'assets/images/default-avatar.svg'; // Use default on error
          }
        );
      }
    } catch (e) {
      console.error('Error in navbar initialization:', e);
      this.isLoggedIn = false;
    }
  }

  getUserDetails(email: string) {
    return this.http.get<any>(`http://localhost:8080/api/users/by-email?email=${email}`);
  }

  logout() {
    // Clear auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('signupData');

    this.isLoggedIn = false;
    this.profilePhotoUrl = null;

    // Navigate to home page
    this.router.navigate(['/']);
  }
}
