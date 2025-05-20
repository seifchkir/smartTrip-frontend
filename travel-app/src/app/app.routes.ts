import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { TestComponent } from './test/test.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: 'sign-up', loadComponent: () => import('./sign-up/sign-up.component').then(m => m.SignUpComponent) },
  { path: 'profile-photo', loadComponent: () => import('./profile-photo/profile-photo.component').then(m => m.ProfilePhotoComponent) },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  // Use direct component reference instead of lazy loading
  
  {
    path: 'profile',
    component: UserProfileComponent
  },
  {
    path: 'trips',
    loadComponent: () => import('./trips/trips.component').then(m => m.TripsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'trending',
    loadComponent: () => import('./trending/trending.component').then(m => m.TrendingComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'test',
    component: TestComponent
  },
  // Add other protected routes here
  { path: '**', redirectTo: '/home' }
];
