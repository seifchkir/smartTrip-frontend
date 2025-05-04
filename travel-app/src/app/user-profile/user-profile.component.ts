import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  // Static user data for demonstration
  user = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    bio: 'Travel enthusiast | Adventure seeker | Photographer',
    location: 'New York, USA',
    joinedDate: 'January 2023'
  };

  // Placeholder for future posts
  posts = [
    { id: 1, placeholder: true },
    { id: 2, placeholder: true },
    { id: 3, placeholder: true }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // In the future, we'll fetch the user based on the route parameter
    this.route.params.subscribe(params => {
      const userId = params['id'];
      console.log('User ID from route:', userId);
      // We'll implement fetching user data here later
    });
  }
}
