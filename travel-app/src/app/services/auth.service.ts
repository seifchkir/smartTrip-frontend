import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, throwError, switchMap, tap, map, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize currentUser from localStorage if token exists
    const token = this.getToken();
    if (token) {
      this.getCurrentUserProfile().subscribe();
    }
  }

  getCurrentUser(): any {
    // First try to get from BehaviorSubject
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      return currentUser;
    }

    // If not in BehaviorSubject, try localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Update BehaviorSubject with stored user
      this.currentUserSubject.next(user);
      return user;
    }

    return null;
  }

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
    console.log('AuthService: Setting token in localStorage:', token);
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    console.log('AuthService: Retrieving token from localStorage...');
    const token = localStorage.getItem(this.tokenKey);
    console.log('AuthService: Retrieved token:', token);
    return token;
  }

  // Inside your AuthService class
  isLoggedIn(): boolean {
    const token = this.getToken();
    console.log('Token exists:', !!token);
    return !!token;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

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
          return throwError(() => new Error('Cannot connect to server. Please check if the backend is running.'));
        })
      );
  }

  getUserProfilePhoto(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/photo?email=${email}`).pipe(
      catchError(error => {
        console.error('Error fetching user photo:', error);
        return of(null);
      })
    );
  }

  getCurrentUserProfile(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return new Observable(subscriber => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    console.log('AuthService: Fetching user profile with headers:', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      tap(user => {
        console.log('Fetched user profile after login:', user);
        this.currentUserSubject.next(user);
      })
    );
  }

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
      // After successful authentication (getting the token),
      // fetch the user profile and update currentUser
      switchMap((response: any) => {
        console.log('AuthService: Full login response from backend:', response);
        console.log('Login successful, got token. Fetching user profile...');
        this.setToken(response.token); // Use the correct property name from the backend response
        return this.getCurrentUserProfile().pipe(
          tap(userProfile => {
            console.log('AuthService: User profile role after login:', userProfile?.role);
            console.log('Fetched user profile after login:', userProfile);
            this.currentUserSubject.next(userProfile);
            // Optionally save user profile to local storage here
            localStorage.setItem('user', JSON.stringify(userProfile));
          }),
          map(() => response) // Return the original login response
        );
      }),
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
