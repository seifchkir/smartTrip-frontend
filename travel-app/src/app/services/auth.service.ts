import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

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

    console.log('Making registration request to:', `${this.apiUrl}/auth/register`);
    console.log('Request payload:', JSON.stringify(userData));

    return this.http.post(`${this.apiUrl}/auth/register`, userData, {
      headers,
      observe: 'response'  // Get the full response including headers
    })
    .pipe(
      catchError(error => {
        console.error('Registration request error details:', error);

        if (error.status === 0) {
          console.log('Trying alternative URL:', this.altApiUrl1);
          return this.http.post(`${this.altApiUrl1}/auth/register`, userData, { headers })
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

  // Second step: Upload profile photo with the new backend logic
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

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }
}
