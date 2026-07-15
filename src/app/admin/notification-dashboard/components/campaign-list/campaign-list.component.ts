import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, TitleCasePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNotificationService } from '../../services/admin-notification.service';
import { Campaign } from '../../../../notification/models/notification.models';

@Component({
  selector: 'app-campaign-list',
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TitleCasePipe, DecimalPipe, SlicePipe]
})
export class CampaignListComponent implements OnInit {
  campaigns: Campaign[] = [];
  isLoading = false;
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;
  
  // Filters
  filterStatus: string = '';
  filterType: string = '';
  
  // Status options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'running', label: 'Running' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'failed', label: 'Failed' }
  ];
  
  typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'push', label: 'Push' }
  ];
  
  // Status colors
  statusColors: { [key: string]: string } = {
    'draft': '#9e9e9e',
    'scheduled': '#ff9800',
    'running': '#2196f3',
    'paused': '#ffc107',
    'completed': '#4caf50',
    'cancelled': '#f44336',
    'failed': '#f44336'
  };
  
  constructor(
    private adminService: AdminNotificationService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadCampaigns();
  }
  
  loadCampaigns(): void {
    this.isLoading = true;
    const filters: { status?: string; type?: string } = {};
    if (this.filterStatus) filters.status = this.filterStatus;
    if (this.filterType) filters.type = this.filterType;
    
    this.adminService.getCampaigns(this.page, this.limit, filters).subscribe({
      next: (response) => {
        this.campaigns = response.data.campaigns;
        this.total = response.data.pagination.total;
        this.totalPages = response.data.pagination.totalPages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading campaigns:', error);
        this.isLoading = false;
      }
    });
  }
  
  onFilterChange(): void {
    this.page = 1;
    this.loadCampaigns();
  }
  
  onPageChange(page: number): void {
    this.page = page;
    this.loadCampaigns();
  }
  
  createCampaign(): void {
    this.router.navigate(['/admin/notifications/campaigns/new']);
  }
  
  editCampaign(campaign: Campaign): void {
    this.router.navigate(['/admin/notifications/campaigns', campaign.id, 'edit']);
  }
  
  startCampaign(campaign: Campaign): void {
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return;
    }
    
    this.adminService.startCampaign(campaign.id).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (error) => {
        console.error('Error starting campaign:', error);
        alert('Failed to start campaign: ' + error.error?.error);
      }
    });
  }
  
  pauseCampaign(campaign: Campaign): void {
    if (campaign.status !== 'running') return;
    
    this.adminService.pauseCampaign(campaign.id).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (error) => {
        console.error('Error pausing campaign:', error);
        alert('Failed to pause campaign');
      }
    });
  }
  
  resumeCampaign(campaign: Campaign): void {
    if (campaign.status !== 'paused') return;
    
    this.adminService.resumeCampaign(campaign.id).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (error) => {
        console.error('Error resuming campaign:', error);
        alert('Failed to resume campaign');
      }
    });
  }
  
  deleteCampaign(campaign: Campaign): void {
    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      return;
    }
    
    this.adminService.deleteCampaign(campaign.id).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (error) => {
        console.error('Error deleting campaign:', error);
        alert('Failed to delete campaign');
      }
    });
  }
  
  getStatusColor(status: string): string {
    return this.statusColors[status] || '#666';
  }
  
  getProgressPercentage(campaign: Campaign): number {
    if (!campaign.totalRecipients) return 0;
    const processed = campaign.sentCount + campaign.failedCount;
    return Math.round((processed / campaign.totalRecipients) * 100);
  }
  
  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }
  
  canStart(campaign: Campaign): boolean {
    return campaign.status === 'draft' || campaign.status === 'scheduled';
  }
  
  canPause(campaign: Campaign): boolean {
    return campaign.status === 'running';
  }
  
  canResume(campaign: Campaign): boolean {
    return campaign.status === 'paused';
  }
  
  canDelete(campaign: Campaign): boolean {
    return campaign.status === 'draft' || campaign.status === 'scheduled';
  }
}
