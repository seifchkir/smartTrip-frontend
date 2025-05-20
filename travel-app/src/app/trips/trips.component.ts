import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { CreatePostComponent } from '../components/create-post/create-post.component';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, CreatePostComponent],
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.scss']
})
export class TripsComponent {
  posts = [
    {
      userName: 'Sarah Johnson',
      userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      location: 'Santorini, Greece',
      timeAgo: '2 hours ago',
      description: 'Just arrived in Santorini and the views are absolutely breathtaking! The white-washed buildings against the blue sea is a sight to behold. Can\'t wait to explore more of this beautiful island!',
      images: [
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
      ],
      likes: 245,
      comments: 32,
      recentComments: [
        {
          userName: 'Michael Chen',
          userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          text: 'Looks amazing! Which hotel are you staying at?'
        },
        {
          userName: 'Emma Wilson',
          userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
          text: 'I was there last month! Don\'t miss the sunset at Oia!'
        }
      ]
    },
    {
      userName: 'David Miller',
      userAvatar: 'https://randomuser.me/api/portraits/men/75.jpg',
      location: 'Kyoto, Japan',
      timeAgo: '5 hours ago',
      description: 'Exploring the ancient temples of Kyoto. The peace and tranquility here is unmatched. The cherry blossoms are starting to bloom!',
      images: [
        'https://images.unsplash.com/photo-1492571350019-22de08371fd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
      ],
      likes: 189,
      comments: 24,
      recentComments: [
        {
          userName: 'Sophia Lee',
          userAvatar: 'https://randomuser.me/api/portraits/women/33.jpg',
          text: 'Beautiful photos! Which temple is this?'
        }
      ]
    }
  ];

  trendingDestinations = [
    {
      name: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      posts: 1567
    },
    {
      name: 'Paris, France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e1e8e5f0f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      posts: 1245
    },
    {
      name: 'New York, USA',
      image: 'https://images.unsplash.com/photo-1485871981521-5b8fd7f7d7b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      posts: 987
    }
  ];

  suggestedUsers = [
    {
      name: 'Carlos Rodriguez',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      followers: 1245
    },
    {
      name: 'Lisa Chen',
      avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
      followers: 876
    },
    {
      name: 'James Wilson',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      followers: 543
    }
  ];
}
