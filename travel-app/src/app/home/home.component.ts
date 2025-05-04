import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  destinations = [
    {
      name: 'Santorini, Greece',
      description: 'Experience the magic of white-washed buildings and stunning sunsets',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      likes: 1245,
      comments: 89,
      userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      userName: 'Sarah Johnson'
    },
    {
      name: 'Kyoto, Japan',
      description: 'Discover ancient temples and beautiful cherry blossoms',
      image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      likes: 987,
      comments: 67,
      userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      userName: 'Michael Chen'
    },
    {
      name: 'Bali, Indonesia',
      description: 'Tropical paradise with rich culture and beautiful beaches',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      likes: 1567,
      comments: 112,
      userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      userName: 'Emma Wilson'
    }
  ];

  testimonials = [
    {
      text: 'This app completely changed how I plan my trips. The community is amazing and the AI trip planner is spot on!',
      name: 'David Miller',
      location: 'New York, USA',
      avatar: 'https://randomuser.me/api/portraits/men/75.jpg'
    },
    {
      text: 'I\'ve discovered so many hidden gems through this platform. The travel stories are inspiring and helpful!',
      name: 'Sophia Lee',
      location: 'London, UK',
      avatar: 'https://randomuser.me/api/portraits/women/33.jpg'
    },
    {
      text: 'The trip planning feature saved me so much time. I got a perfect itinerary for my Japan trip!',
      name: 'Carlos Rodriguez',
      location: 'Madrid, Spain',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg'
    }
  ];
}
