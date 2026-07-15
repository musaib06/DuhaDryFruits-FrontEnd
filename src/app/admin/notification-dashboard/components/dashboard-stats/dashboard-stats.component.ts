import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNotificationService } from '../../services/admin-notification.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-stats',
  templateUrl: './dashboard-stats.component.html',
  styleUrls: ['./dashboard-stats.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class DashboardStatsComponent implements OnInit, OnDestroy {
  stats: any = null;
  queueStats: any[] = [];
  isLoading = true;
  healthStatus: any = null;
  backendUnavailable = false;
  
  private refreshSubscription: Subscription | null = null;
  
  // Status colors
  statusColors: { [key: string]: string } = {
    'healthy': '#4caf50',
    'unhealthy': '#f44336',
    'warning': '#ff9800'
  };
  
  constructor(private adminService: AdminNotificationService) {}
  
  ngOnInit(): void {
    this.loadStats();
    this.loadHealthStatus();
    
    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadStats();
    });
  }
  
  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
  loadStats(): void {
    this.backendUnavailable = false;
    this.adminService.getDashboardStats().subscribe({
      next: (response) => {
        this.stats = response.data;
        this.isLoading = false;
        this.backendUnavailable = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.isLoading = false;
        // Check if backend is unavailable (502/503/CORS errors)
        if (error.status === 0 || error.status === 502 || error.status === 503) {
          this.backendUnavailable = true;
        }
      }
    });
    
    this.adminService.getQueueStats().subscribe({
      next: (response) => {
        this.queueStats = response.data;
      },
      error: (error) => {
        console.error('Error loading queue stats:', error);
      }
    });
  }
  
  loadHealthStatus(): void {
    this.adminService.getHealthStatus().subscribe({
      next: (response) => {
        this.healthStatus = response.data;
      },
      error: (error) => {
        console.error('Error loading health status:', error);
      }
    });
  }
  
  refresh(): void {
    this.isLoading = true;
    this.loadStats();
    this.loadHealthStatus();
  }
  
  getHealthColor(service: string): string {
    if (!this.healthStatus) return '#999';
    const status = this.healthStatus[service]?.healthy ? 'healthy' : 'unhealthy';
    return this.statusColors[status];
  }
}
