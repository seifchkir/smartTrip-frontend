import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-profile-photo',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  providers: [AuthService],
  templateUrl: './profile-photo.component.html',
  styleUrls: ['./profile-photo.component.scss']
})
export class ProfilePhotoComponent implements OnInit {
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  userData: any;
  errorMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Retrieve user data from localStorage
    const data = localStorage.getItem('signupData');
    if (!data) {
      console.error('No signup data found in localStorage');
      // If no data is found, redirect back to signup
      this.router.navigate(['/sign-up']).then(success => {
        if (!success) {
          console.error('Navigation to sign-up failed');
        }
      });
      return;
    }

    try {
      this.userData = JSON.parse(data);
      console.log('Profile photo component initialized with user data:', this.userData);
    } catch (error) {
      console.error('Error parsing signup data:', error);
      this.router.navigate(['/sign-up']);
    }
  }

  onFileUploadClick() {
    document.getElementById('photo-upload')?.click();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];

    // Create a preview
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result || null;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  completeSignup() {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a profile photo first.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Create form data to send the file
    const formData = new FormData();

    // Use 'profilePicture' as the parameter name to match the backend
    formData.append('profilePicture', this.selectedFile, this.selectedFile.name);

    // Add email directly in the component
    if (this.userData && this.userData.email) {
      formData.append('email', this.userData.email);
      console.log('Adding email to form data:', this.userData.email);
    }

    console.log('Selected file details:', {
      name: this.selectedFile.name,
      type: this.selectedFile.type,
      size: this.selectedFile.size
    });

    // Call the upload profile photo API
    this.authService.uploadProfilePhoto('not-used', formData).subscribe({
      next: (response) => {
        console.log('Photo upload successful:', response);

        // Store the auth token if provided
        if (response && response.token) {
          this.authService.setToken(response.token);
        }

        // Clear the temporary storage
        localStorage.removeItem('signupData');

        // Navigate to home page instead of trips
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Photo upload error:', error);

        // Even if there's an error, proceed to the home page
        console.log('Proceeding to home page despite error');
        localStorage.removeItem('signupData');
        this.router.navigate(['/home']);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  skipPhotoUpload() {
    // Clear the temporary storage
    localStorage.removeItem('signupData');

    // Navigate to home page instead of trips
    this.router.navigate(['/home']);
  }
}
