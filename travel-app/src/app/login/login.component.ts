import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  providers: [AuthService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  submitted = false;
  errorMessage = '';
  isLoading = false;
  showResetOption = false;
  resetRequestSent = false;
  successMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Initialize component
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.isLoading = true;

    console.log('Login attempt:', this.loginData);

    const credentials = {
      email: this.loginData.email,
      password: this.loginData.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful:', response);

        // The authService.login now handles fetching and setting the user profile
        // and token internally via switchMap. The 'response' here is the final result
        // from the authentication request (often just the token object).
        // The user profile is already updated in the AuthService and localStorage.

        // Navigate to home page after the entire login process is successful
        console.log('Login process completed, navigating to home.');
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage = error.message || 'Login failed. Please try again.';

        // Check if this is an account locked error
        if (this.errorMessage.includes('temporarily locked')) {
          this.errorMessage += ' Would you like to reset your password?';
          this.showResetOption = true;
        }

        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Add this method to handle password reset requests
  requestPasswordReset() {
    if (!this.loginData.email) {
      this.errorMessage = 'Please enter your email address to reset your password.';
      return;
    }

    this.isLoading = true;
    this.authService.requestPasswordReset(this.loginData.email).subscribe({
      next: () => {
        this.resetRequestSent = true;
        this.errorMessage = '';
        this.successMessage = 'Password reset instructions have been sent to your email.';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to request password reset. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
