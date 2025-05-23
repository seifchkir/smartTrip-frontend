import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private postsSubject = new BehaviorSubject<any[]>([]);
  public posts$ = this.postsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Load initial posts
    this.loadUserPosts();
  }

  loadUserPosts() {
    const userId = this.getUserId();
    if (userId) {
      const headers = this.getAuthHeaders();
      // Updated URL to match the correct endpoint
      this.http.get<any[]>(`${environment.apiUrl}/social/user/posts`, { headers })
        .subscribe({
          next: (posts) => {
            console.log('Loaded user posts:', posts);

            // Convert object to array if needed
            let postsArray = posts;
            if (posts && !Array.isArray(posts)) {
              postsArray = Object.values(posts);
            }

            this.postsSubject.next(postsArray);
          },
          error: (error) => {
            console.error('Error loading user posts:', error);
            this.postsSubject.next([]);
          }
        });
    } else {
      this.postsSubject.next([]);
    }
  }

  createPost(postData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return new Observable(observer => {
      this.http.post(`${environment.apiUrl}/posts`, postData, { headers })
        .subscribe({
          next: (newPost: any) => {
            console.log('Post created successfully:', newPost);

            // Update the posts list with the new post
            const currentPosts = this.postsSubject.getValue();
            this.postsSubject.next([newPost, ...currentPosts]);

            observer.next(newPost);
            observer.complete();
          },
          error: (error) => {
            console.error('Error creating post:', error);
            observer.error(error);
          }
        });
    });
  }

  private getUserId(): string | null {
    // Try to get user ID from various sources
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        if (profile && profile.id) {
          return profile.id;
        }
      } catch (e) {
        console.error('Error parsing user profile:', e);
      }
    }

    // Fallback to other sources if needed
    const signupData = localStorage.getItem('signupData');
    if (signupData) {
      try {
        const userData = JSON.parse(signupData);
        if (userData && userData.id) {
          return userData.id;
        }
      } catch (e) {
        console.error('Error parsing signup data:', e);
      }
    }

    return null;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Add a method to get user's photo URL
  getUserPhotoUrl(): string {
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        if (profile && profile.photoUrl) {
          return profile.photoUrl;
        }
      } catch (e) {
        console.error('Error parsing user profile:', e);
      }
    }
    // Return a default image path if no photo URL is found
    return 'assets/images/default-user.jpg';
  }
}
