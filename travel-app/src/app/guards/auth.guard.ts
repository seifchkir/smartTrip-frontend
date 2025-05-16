import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    console.log('AuthGuard.canActivate called');
    console.log('Is logged in:', this.authService.isLoggedIn());

    if (this.authService.isLoggedIn()) {
      return true;
    }

    // Redirect to login page if not authenticated
    this.router.navigate(['/login']);
    return false;
  }
}
