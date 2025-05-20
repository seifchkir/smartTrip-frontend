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
      this.http.get<any[]>(`${environment.apiUrl}/posts/user/${userId}`, { headers })
        .subscribe({
          next: (posts) => {
            console.log('Loaded user posts:', posts);
            this.postsSubject.next(posts);
          },
          error: (error) => {
            console.error('Error loading user posts:', error);
          }
        });
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
}
