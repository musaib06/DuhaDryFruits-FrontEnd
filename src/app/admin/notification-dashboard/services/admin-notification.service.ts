/**
 * Admin Notification Service
 * Service for admin notification operations
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppConstants } from '../../../../app-constants';
import { Campaign, NotificationStats } from '../../../notification/models/notification.models';

export interface CampaignRequest {
  name: string;
  description?: string;
  type: 'push';
  content: {
    title?: string;
    body?: string;
    mediaUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
  };
  segment: {
    type: string;
    filters?: Record<string, any>;
  };
  scheduledAt?: Date;
}

export type PushAudience = 'all' | 'customers' | 'selected';

export interface SendPushRequest {
  title: string;
  message: string;
  productId?: number | null;
  url?: string | null;
  route?: string | null;
  imageUrl?: string | null;
  audience?: PushAudience;
  customerIds?: number[] | null;
}

export interface CampaignResponse {
  success: boolean;
  campaignId?: number;
  status?: string;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  success: boolean;
  data: {
    today: {
      sent: number;
      delivered: number;
      failed: number;
    };
    campaigns: {
      active: number;
      total: number;
      scheduled: number;
    };
    queues: Array<{
      name: string;
      waiting: number;
      active: number;
      failed: number;
    }>;
  };
}

export interface NotificationLogAdmin {
  id: number;
  customerId: number;
  type: string;
  status: string;
  templateName?: string;
  phoneNumber?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failureReason?: string;
  createdAt: string;
  campaign?: {
    id: number;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationService {
  private apiUrl = `${environment.apiBaseUrl}${AppConstants.ApiUrls.BASE}/notifications/admin`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
  }
  
  /**
   * Get queue statistics
   */
  getQueueStats(): Observable<{ success: boolean; data: Array<{ name: string; waiting: number; active: number; failed: number; delayed: number }> }> {
    return this.http.get<{ success: boolean; data: Array<{ name: string; waiting: number; active: number; failed: number; delayed: number }> }>(`${this.apiUrl}/queues`);
  }
  
  /**
   * Get all campaigns
   */
  getCampaigns(page: number = 1, limit: number = 20, filters?: { status?: string; type?: string }): Observable<{
    success: boolean;
    data: {
      campaigns: Campaign[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    
    return this.http.get<{
      success: boolean;
      data: {
        campaigns: Campaign[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>(`${this.apiUrl}/campaigns`, { params });
  }
  
  /**
   * Get campaign by ID
   */
  getCampaign(id: number): Observable<{ success: boolean; data: { campaign: Campaign; stats: any } }> {
    return this.http.get<{ success: boolean; data: { campaign: Campaign; stats: any } }>(`${this.apiUrl}/campaigns/${id}`);
  }
  
  /**
   * Create new campaign
   */
  createCampaign(campaign: CampaignRequest): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(`${this.apiUrl}/campaigns`, campaign);
  }
  
  /**
   * Update campaign
   */
  updateCampaign(id: number, updates: Partial<CampaignRequest>): Observable<{ success: boolean; data: Campaign }> {
    return this.http.put<{ success: boolean; data: Campaign }>(`${this.apiUrl}/campaigns/${id}`, updates);
  }
  
  /**
   * Delete campaign
   */
  deleteCampaign(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/campaigns/${id}`);
  }
  
  /**
   * Start campaign
   */
  startCampaign(id: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(`${this.apiUrl}/campaigns/${id}/start`, {});
  }
  
  /**
   * Pause campaign
   */
  pauseCampaign(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/campaigns/${id}/pause`, {});
  }
  
  /**
   * Resume campaign
   */
  resumeCampaign(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/campaigns/${id}/resume`, {});
  }
  
  /**
   * Send a push notification broadcast.
   */
  sendPush(request: SendPushRequest): Observable<{ success: boolean; message?: string; data?: any; error?: string }> {
    return this.http.post<{ success: boolean; message?: string; data?: any; error?: string }>(
      `${this.apiUrl}/send-push`,
      request
    );
  }
  
  /**
   * Get notification logs
   */
  getNotificationLogs(
    page: number = 1,
    limit: number = 50,
    filters?: { type?: string; status?: string; search?: string }
  ): Observable<{
    success: boolean;
    data: {
      logs: NotificationLogAdmin[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    
    return this.http.get<{
      success: boolean;
      data: {
        logs: NotificationLogAdmin[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>(`${this.apiUrl}/logs`, { params });
  }
  
  /**
   * Get health status
   */
  getHealthStatus(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/health`);
  }
  
  /**
   * Test send a push notification to a single device token.
   */
  testSend(recipient: string, data: { title: string; body: string }): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/test-send`, {
      recipient,
      ...data
    });
  }
}
