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
      confirmPassword: ['', Validators.required],
      birthday: ['', [Validators.required]]
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

          // Store user data for the next step
          const userDataForStorage = {
            ...userData,
            id: response?.id || response?.userId || response?.user?.id || 'temp-' + Date.now()
          };

          console.log('Storing user data:', userDataForStorage);
          localStorage.setItem('signupData', JSON.stringify(userDataForStorage));
          localStorage.setItem('userEmail', userData.email);

          // Store the token if it exists in the response
          if (response?.token) {
            this.authService.setToken(response.token);
          }

          // Navigate to the photo upload page
          this.router.navigate(['/profile-photo']).then(success => {
            if (!success) {
              console.error('Navigation to profile-photo failed');
              this.errorMessage = 'Failed to proceed to profile photo upload. Please try again.';
            }
          });
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
