import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';

interface Destination {
  id: string;
  name: string;
  description: string;
  image: string;
  location: string;
  likes: number;
  comments: number;
  tags: string[];
  region: string;
  weather: string;
  temperature: number;
  rating: number;
  topReview: string;
  reviewAuthor: string;
  priceLevel: string;
  dateAdded: Date;
  liked: boolean;
  saved: boolean;
  showTips?: boolean;
  tips?: string[];
}

interface Traveler {
  name: string;
  avatar: string;
  posts: number;
  followed: boolean;
}

interface Tag {
  name: string;
  count: number;
}

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.scss']
})
export class TrendingComponent implements OnInit {
  // Properties
  trendingPlaces: Destination[] = [];
  filteredPlaces: Destination[] = [];
  topTravelers: Traveler[] = [];
  popularTags: Tag[] = [];

  // UI State
  searchTerm: string = '';
  currentFilter: string = 'All';
  sortOption: string = 'popular';
  darkMode: boolean = false;
  hasMoreDestinations: boolean = true;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;

  ngOnInit(): void {
    this.loadDestinations();
    this.loadTravelers();
    this.loadTags();
    this.filteredPlaces = [...this.trendingPlaces];

    // Check for user preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      this.toggleTheme();
    }
  }

  // Load initial data
  loadDestinations(): void {
    this.trendingPlaces = [
      {
        id: 'bali-indonesia',
        name: 'Bali, Indonesia',
        description: 'Tropical paradise with rich culture and beautiful beaches',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        location: 'Indonesia',
        likes: 1567,
        comments: 245,
        tags: ['Beach', 'Culture', 'Adventure'],
        region: 'Asia',
        weather: 'sunny',
        temperature: 29,
        rating: 4.8,
        topReview: 'Absolutely breathtaking beaches and the local culture is amazing!',
        reviewAuthor: 'Jessica T.',
        priceLevel: '$$',
        dateAdded: new Date('2025-04-15'),
        liked: false,
        saved: false,
        tips: [
          'Visit Ubud Monkey Forest',
          'Try traditional Balinese food',
          'Watch sunset at Tanah Lot Temple'
        ]
      },
      {
        id: 'santorini-greece',
        name: 'Santorini, Greece',
        description: 'White-washed buildings and stunning sunsets over the Aegean Sea',
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        location: 'Greece',
        likes: 1245,
        comments: 189,
        tags: ['Island', 'Romantic', 'Views'],
        region: 'Europe',
        weather: 'partly-cloudy',
        temperature: 24,
        rating: 4.9,
        topReview: 'The sunsets here are unmatched! Perfect for couples.',
        reviewAuthor: 'Michael R.',
        priceLevel: '$$$',
        dateAdded: new Date('2025-04-18'),
        liked: false,
        saved: false,
        tips: [
          'Book accommodations with caldera views',
          'Visit Oia for the best sunset views',
          'Try local wine tasting experiences'
        ]
      },
      {
        id: 'kyoto-japan',
        name: 'Kyoto, Japan',
        description: 'Ancient temples and beautiful cherry blossoms',
        image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        location: 'Japan',
        likes: 987,
        comments: 156,
        tags: ['Culture', 'Temples', 'Nature'],
        region: 'Asia',
        weather: 'cloudy',
        temperature: 18,
        rating: 4.7,
        topReview: 'The blend of natural beauty and historical significance is magical.',
        reviewAuthor: 'David L.',
        priceLevel: '$$',
        dateAdded: new Date('2025-04-10'),
        liked: false,
        saved: false,
        tips: [
          'Rent a kimono for temple visits',
          'Visit Arashiyama Bamboo Grove early morning',
          'Try traditional tea ceremony'
        ]
      },
      {
        id: 'paris-france',
        name: 'Paris, France',
        description: 'The city of love and lights',
        image: 'https://images.unsplash.com/photo-1502602898657-3e1e8e5f0f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        location: 'France',
        likes: 876,
        comments: 134,
        tags: ['City', 'Romantic', 'Culture'],
        region: 'Europe',
        weather: 'rainy',
        temperature: 16,
        rating: 4.6,
        topReview: 'Even in the rain, Paris maintains its charm and beauty.',
        reviewAuthor: 'Emma W.',
        priceLevel: '$$$',
        dateAdded: new Date('2025-04-12'),
        liked: false,
        saved: false,
        tips: [
          'Visit the Louvre on Wednesday for fewer crowds',
          'Try pastries from local bakeries',
          'Book Eiffel Tower tickets in advance'
        ]
      },
      {
        id: 'cape-town-south-africa',
        name: 'Cape Town, South Africa',
        description: 'Stunning coastal city with mountain views and vibrant culture',
        image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        location: 'South Africa',
        likes: 743,
        comments: 98,
        tags: ['Beach', 'Adventure', 'Nature'],
        region: 'Africa',
        weather: 'sunny',
        temperature: 22,
        rating: 4.7,
        topReview: 'The mix of natural beauty and urban sophistication is incredible.',
        reviewAuthor: 'James M.',
        priceLevel: '$$',
        dateAdded: new Date('2025-04-05'),
        liked: false,
        saved: false,
        tips: [
          'Take the cable car to Table Mountain',
          'Visit Boulders Beach to see penguins',
          'Try local wines from nearby vineyards'
        ]
      },
      {
        
        id: 'new-york-usa',
        name: 'New York City, USA',
        description: 'The city that never sleeps with iconic skyline and diverse culture',
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        location: 'USA',
        likes: 825,
        comments: 178,
        tags: ['City', 'Shopping', 'Entertainment'],
        region: 'Americas',
        weather: 'partly-cloudy',
        temperature: 15,
        rating: 4.5,
        topReview: 'Endless things to do and incredible food around every corner.',
        reviewAuthor: 'Sophie K.',
        priceLevel: '$$$',
        dateAdded: new Date('2025-04-20'),
        liked: false,
        saved: false,
        tips: [
          'Get CityPASS for major attractions',
          'Explore neighborhoods beyond Manhattan',
          'Try food from local food trucks'
        ]
      }
    ];
  }

  loadTravelers(): void {
    this.topTravelers = [
      {
        name: 'Sarah Johnson',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        posts: 156,
        followed: false
      },
      {
        name: 'Michael Chen',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        posts: 143,
        followed: false
      },
      {
        name: 'Emma Wilson',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        posts: 128,
        followed: false
      }
    ];
  }

  loadTags(): void {
    this.popularTags = [
      { name: 'BeachLife', count: 1567 },
      { name: 'CityBreak', count: 1245 },
      { name: 'Adventure', count: 987 },
      { name: 'LocalFood', count: 876 },
      { name: 'Culture', count: 765 },
      { name: 'Nature', count: 654 }
    ];
  }

  // Feature methods
  filterDestinations(): void {
    // First apply search filter
    let results = this.trendingPlaces.filter(place => {
      const searchMatch = this.searchTerm ?
        place.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        place.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        place.location.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        place.tags.some(tag => tag.toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;

      // Then apply region filter
      const regionMatch = this.currentFilter === 'All' ? true : place.region === this.currentFilter;

      return searchMatch && regionMatch;
    });

    // Apply sorting
    this.applySort(results);

    // Update filtered places
    this.filteredPlaces = results.slice(0, this.currentPage * this.itemsPerPage);

    // Check if we have more destinations to load
    this.hasMoreDestinations = results.length > this.filteredPlaces.length;
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.filterDestinations();
  }

  sortDestinations(): void {
    this.currentPage = 1;
    this.filterDestinations();
  }

  private applySort(places: Destination[]): void {
    switch(this.sortOption) {
      case 'popular':
        places.sort((a, b) => b.likes - a.likes);
        break;
      case 'recent':
        places.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
        break;
      case 'likes':
        places.sort((a, b) => b.likes - a.likes);
        break;
    }
  }

  loadMoreDestinations(): void {
    this.currentPage++;
    this.filterDestinations();
  }

  likeDestination(place: Destination): void {
    place.liked = !place.liked;
    place.likes += place.liked ? 1 : -1;
  }

  saveDestination(place: Destination): void {
    place.saved = !place.saved;
    // Here you would typically update a user's saved destinations in a service
  }

  followTraveler(traveler: Traveler): void {
    traveler.followed = !traveler.followed;
    // Here you would typically update following status in a service
  }

  filterByTag(tagName: string): void {
    this.searchTerm = tagName;
    this.filterDestinations();
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    if (this.darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  // Utility methods for UI
  getWeatherIcon(weather: string): string {
    switch(weather) {
      case 'sunny': return 'fa-sun';
      case 'partly-cloudy': return 'fa-cloud-sun';
      case 'cloudy': return 'fa-cloud';
      case 'rainy': return 'fa-cloud-rain';
      case 'stormy': return 'fa-bolt';
      default: return 'fa-sun';
    }
  }

  generateRatingStars(rating: number): number[] {
    const fullStars = Math.floor(rating);
    const result = Array(fullStars).fill(1);

    if (rating % 1 >= 0.5) {
      result.push(0.5); // Half star
    }

    while (result.length < 5) {
      result.push(0); // Empty star
    }

    return result;
  }
}
