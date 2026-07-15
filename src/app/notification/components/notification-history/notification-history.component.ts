import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { NotificationLog } from '../../models/notification.models';

@Component({
  selector: 'app-notification-history',
  templateUrl: './notification-history.component.html',
  styleUrls: ['./notification-history.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, SlicePipe]
})
export class NotificationHistoryComponent implements OnInit {
  logs: NotificationLog[] = [];
  isLoading = false;
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;
  
  // Filter options
  filterType: string = '';
  filterStatus: string = '';
  
  // Status colors for UI
  statusColors: { [key: string]: string } = {
    'sent': '#4caf50',
    'delivered': '#2196f3',
    'read': '#9c27b0',
    'failed': '#f44336',
    'pending': '#ff9800',
    'queued': '#00bcd4'
  };
  
  // Type icons
  typeIcons: { [key: string]: string } = {
    'whatsapp': '💬',
    'push': '📱',
    'email': '📧',
    'sms': '💬'
  };
  
  constructor(private notificationService: NotificationService) {}
  
  ngOnInit(): void {
    this.loadHistory();
  }
  
  loadHistory(): void {
    this.isLoading = true;
    const filters: { type?: string; status?: string } = {};
    if (this.filterType) filters.type = this.filterType;
    if (this.filterStatus) filters.status = this.filterStatus;
    
    this.notificationService.getNotificationHistory(this.page, this.limit, filters).subscribe({
      next: (response) => {
        this.logs = response.data.logs;
        this.total = response.data.pagination.total;
        this.totalPages = response.data.pagination.totalPages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notification history:', error);
        this.isLoading = false;
      }
    });
  }
  
  onPageChange(page: number): void {
    this.page = page;
    this.loadHistory();
  }
  
  onFilterChange(): void {
    this.page = 1;
    this.loadHistory();
  }
  
  getStatusColor(status: string): string {
    return this.statusColors[status] || '#666';
  }
  
  getTypeIcon(type: string): string {
    return this.typeIcons[type] || '📢';
  }
  
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString();
  }
}
