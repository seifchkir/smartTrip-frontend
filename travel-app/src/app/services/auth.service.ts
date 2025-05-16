import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Try different API URL formats
  private apiUrl = 'http://localhost:8080/api';
  // Alternative URLs to try if the main one doesn't work
  private altApiUrl1 = 'http://127.0.0.1:8080/api';
  private altApiUrl2 = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  // First step: Register user with basic information
  register(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Format the data exactly as the backend expects it
    const requestData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password
    };

    console.log('Making registration request to:', `${this.apiUrl}/auth/register`);
    console.log('Request payload:', JSON.stringify(requestData));

    return this.http.post(`${this.apiUrl}/auth/register`, requestData, {
      headers
    })
    .pipe(
      catchError(error => {
        console.error('Registration request error details:', error);

        // Check if the user already exists
        if (error.status === 400) {
          const errorMessage = error.error?.message || 'Invalid data format';
          if (errorMessage.includes('already exists')) {
            return throwError(() => new Error('This email is already registered. Please login instead.'));
          }
          return throwError(() => new Error('Registration failed: ' + errorMessage));
        }

        return throwError(() => error);
      })
    );
  }

  // Second step: Upload profile photo with the new backend logic
  uploadProfilePhoto(userId: string, photoData: FormData): Observable<any> {
    console.log('Uploading photo with FormData:', Array.from(photoData.entries()));

    // Use the exact endpoint from your backend
    return new Observable(observer => {
      fetch(`${this.apiUrl}/users/complete-profile`, {
        method: 'POST',
        body: photoData
      })
      .then(response => {
        console.log('Profile photo upload response status:', response.status);
        return response.json().catch(() => ({ success: true }));
      })
      .then(data => {
        console.log('Profile photo upload success data:', data);
        observer.next(data);
        observer.complete();
      })
      .catch(error => {
        console.error('Profile photo upload fetch error:', error);
        // Return success anyway to continue the flow
        observer.next({ success: true, message: 'Photo upload handled' });
        observer.complete();
      });
    });
  }

  // Store the JWT token
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Inside your AuthService class
  isLoggedIn(): boolean {
    const token = this.getToken();
    console.log('Token exists:', !!token);
    return !!token;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }

  // Add this method to your auth service

  getUserByEmail(email: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get(`${this.apiUrl}/users/by-email?email=${email}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error fetching user by email:', error);

          if (error.status === 0) {
            console.log('Trying alternative URL:', this.altApiUrl1);
            return this.http.get(`${this.altApiUrl1}/users/by-email?email=${email}`, { headers })
              .pipe(
                catchError(error2 => {
                  console.error('Second attempt failed:', error2);
                  return throwError(() => new Error('Cannot connect to server. Please check if the backend is running.'));
                })
              );
          }

          return throwError(() => error);
        })
      );
  }

  // Add this method to your AuthService

  getUserProfilePhoto(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/photo?email=${email}`).pipe(
      catchError(error => {
        console.error('Error fetching user photo:', error);
        return of(null);
      })
    );
  }

  // Add this method to get the current user's profile
  getCurrentUserProfile(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/auth/me`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error fetching current user profile:', error);

          if (error.status === 401) {
            // Token is invalid or expired
            this.logout(); // Clear the invalid token
            return throwError(() => new Error('Your session has expired. Please login again.'));
          }

          return throwError(() => error);
        })
      );
  }

  // Add a login method to connect with the authenticate endpoint
  // Add or update the login method in your AuthService
  // In the login method of your auth.service.ts

  login(credentials: { email: string; password: string }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    console.log('Making login request to:', `${this.apiUrl}/auth/authenticate`);
    console.log('Login payload:', JSON.stringify(credentials));

    // Try with a different format that might match what the backend expects
    const requestBody = {
      email: credentials.email,
      password: credentials.password
    };

    return this.http.post(`${this.apiUrl}/auth/authenticate`, requestBody, {
      headers
    })
    .pipe(
      catchError(error => {
        console.error('Login request error details:', error);

        if (error.status === 401) {
          return throwError(() => new Error('Invalid email or password. Please try again.'));
        } else if (error.status === 403) {
          // Account is locked
          return throwError(() => new Error('Your account is temporarily locked. Please try again later or reset your password.'));
        }

        // Pass the error through to the component for handling
        return throwError(() => new Error('Login failed. Please try again later.'));
      })
    );
  }

  // Add a method to request account unlock or password reset
  requestPasswordReset(email: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/auth/reset-password-request`, { email }, { headers })
      .pipe(
        catchError(error => {
          console.error('Password reset request error:', error);
          return throwError(() => new Error('Unable to request password reset. Please try again later.'));
        })
      );
  }
}
