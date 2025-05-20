import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private apiUrl = 'http://localhost:8080/api/social';

  constructor(private http: HttpClient) { }

  createPost(postData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
      // Note: Don't set Content-Type here, let the browser set it with the boundary for multipart/form-data
    });

    return this.http.post(`${this.apiUrl}/posts`, postData, { headers });
  }

  getPosts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/posts`);
  }
}
