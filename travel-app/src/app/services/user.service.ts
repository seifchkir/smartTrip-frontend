import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api'; // Replace with your actual backend URL

  constructor(private http: HttpClient) {}

  getAgeDistribution(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/admin/analytics/age-distribution`);
  }

  getContentModerationData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/moderation/posts`);
  }

  markPostAsReviewed(postId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/admin/moderation/posts/${postId}/review`, {});
  }
}
