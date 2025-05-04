import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { provideHttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  providers: [AuthService],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  signUpForm!: FormGroup;
  submitted = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Initialize form in ngOnInit instead of constructor
    this.signUpForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });

    console.log('SignUpComponent initialized');
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { 'mismatch': true };
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.signUpForm.valid) {
      this.isLoading = true;

      const userData = {
        firstName: this.signUpForm.value.firstName,
        lastName: this.signUpForm.value.lastName,
        email: this.signUpForm.value.email,
        password: this.signUpForm.value.password
      };

      console.log('Submitting form with data:', userData);

      this.authService.register(userData).subscribe({
        next: (response) => {
          console.log('Registration successful, full response:', response);

          // Log the response structure to better understand it
          console.log('Response type:', typeof response);
          console.log('Response keys:', Object.keys(response));

          // Extract the ID from the response, checking various possible locations
          let userId = null;

          // If response is HttpResponse object (when using observe: 'response')
          if (response.body) {
            console.log('Response body keys:', Object.keys(response.body));
            userId = response.body.id || response.body._id || response.body.userId ||
                    (response.body.user && (response.body.user.id || response.body.user._id));

            // If response body contains data property (common in API responses)
            if (response.body.data) {
              userId = response.body.data.id || response.body.data._id || response.body.data.userId ||
                      (response.body.data.user && (response.body.data.user.id || response.body.data.user._id));
            }
          } else {
            // Direct response object
            console.log('Direct response keys:', Object.keys(response));
            userId = response.id || response._id || response.userId ||
                    (response.user && (response.user.id || response.user._id));

            // If response contains data property
            if (response.data) {
              userId = response.data.id || response.data._id || response.data.userId ||
                      (response.data.user && (response.data.user.id || response.data.user._id));
            }
          }

          console.log('Extracted user ID:', userId);

          // For testing purposes, if no ID is found, create a temporary one
          if (!userId) {
            console.warn('Could not find user ID in response. Using temporary ID for testing.');
            userId = 'temp-' + Date.now();
          }

          // Store user data including the ID returned from the backend
          const userDataForStorage = {
            ...userData,
            id: userId
          };

          console.log('Storing user data:', userDataForStorage);
          localStorage.setItem('signupData', JSON.stringify(userDataForStorage));

          // Store email separately for easier access
          localStorage.setItem('userEmail', userData.email);

          // Navigate to the photo upload page
          this.router.navigate(['/profile-photo']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.errorMessage = error.message || 'Registration failed. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
