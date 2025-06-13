import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  // Age group destination preferences chart
  ageGroupChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
    datasets: [
      {
        data: [65, 59, 80, 81, 56],
        label: 'Paris',
        backgroundColor: 'rgba(255, 99, 132, 0.5)'
      },
      {
        data: [28, 48, 40, 19, 86],
        label: 'London',
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      },
      {
        data: [45, 25, 16, 36, 67],
        label: 'Rome',
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      }
    ]
  };

  ageGroupChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Destination Preferences by Age Group'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Bookings'
        }
      }
    }
  };

  // Booking statistics
  bookingStats = {
    totalBookings: 1234,
    activeBookings: 567,
    completedBookings: 667,
    revenue: 45678
  };

  // Recent bookings
  recentBookings = [
    {
      id: '1',
      user: 'John Doe',
      destination: 'Paris',
      date: '2024-03-15',
      status: 'Confirmed'
    },
    {
      id: '2',
      user: 'Jane Smith',
      destination: 'London',
      date: '2024-03-14',
      status: 'Pending'
    },
    {
      id: '3',
      user: 'Mike Johnson',
      destination: 'Rome',
      date: '2024-03-13',
      status: 'Completed'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // In a real application, you would fetch this data from your backend
    // this.loadDashboardData();
  }

  // loadDashboardData() {
  //   // Fetch data from your backend API
  //   // Update the chart data and statistics
  // }
}
