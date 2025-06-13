import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData, ChartType } from 'chart.js';
import { ChartOptions } from 'chart.js';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, NgChartsModule]
})
export class AdminDashboardComponent implements OnInit {
  // Age distribution chart data
  public ageChartData: ChartData = {
    labels: ['0-18', '19-25', '26-35', '36-45', '46-55', '56+'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0],
      label: 'Users by Age Group',
      backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF6B81']
    }]
  };

  // Chart options
  public ageChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12
          }
        },
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false
      }
    }
  };

  // Content moderation data
  public posts: any[] = [];
  public loading = true;
  public chartType: ChartType = 'bar';

  constructor(
    public authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initializeChartData();
    this.loadAgeDistribution();
    this.loadContentModerationData();
  }

  private initializeChartData() {
    // Initialize chart with sample data
    this.ageChartData.datasets[0].data = [15, 30, 25, 12, 8, 5];
  }

  private loadAgeDistribution(): void {
    this.userService.getAgeDistribution().subscribe({
      next: (data) => {
        // Update chart data with actual values
        this.ageChartData.datasets[0].data = data;
      },
      error: (error) => {
        console.error('Error loading age distribution:', error);
      }
    });
  }

  private loadContentModerationData(): void {
    this.userService.getContentModerationData().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading content moderation data:', error);
        this.loading = false;
      }
    });
  }

  public markAsReviewed(postId: string): void {
    this.userService.markPostAsReviewed(postId).subscribe({
      next: () => {
        this.loadContentModerationData();
      },
      error: (error) => {
        console.error('Error marking post as reviewed:', error);
      }
    });
  }
}
