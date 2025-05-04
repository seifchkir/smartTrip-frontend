import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ProfilePhotoComponent } from './profile-photo/profile-photo.component';
import { TripsComponent } from './trips/trips.component';
import { TrendingComponent } from './trending/trending.component';
import { TestComponent } from './test/test.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'sign-up', redirectTo: 'signup', pathMatch: 'full' },
  { path: 'profile-photo', component: ProfilePhotoComponent },
  { path: 'trips', component: TripsComponent },
  { path: 'trending', component: TrendingComponent },
  { path: 'test', component: TestComponent }, // Add test route
  { path: 'users/:id', component: UserProfileComponent },
  { path: '**', redirectTo: '' }
];
