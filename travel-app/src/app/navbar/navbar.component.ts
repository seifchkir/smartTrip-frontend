import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  profilePhotoUrl?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  user: User | null = null;
  userId: string | null = null;
  profilePhotoUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.user = user;
      this.isLoggedIn = !!user;
      this.isAdmin = user?.role === 'ADMIN';
      if (this.isLoggedIn && user) {
        this.userId = user.id;
        // Load profile photo if available
        if (user.profilePhotoUrl) {
          this.profilePhotoUrl = user.profilePhotoUrl;
        }
      }
    });
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userId = null;
    this.profilePhotoUrl = null;
    this.isAdmin = false;
    this.router.navigate(['/login']);
  }

  goToUserProfile() {
    if (this.userId) {
      this.router.navigate(['/users', this.userId]);
    }
  }
}
