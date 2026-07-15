/**
 * Notification Service
 * Service for managing customer notifications
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppConstants } from '../../../app-constants';
import { NotificationPreferences, NotificationLog, NotificationStats } from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiBaseUrl}${AppConstants.ApiUrls.BASE}/notifications`;
  
  private preferencesSubject = new BehaviorSubject<NotificationPreferences | null>(null);
  public preferences$ = this.preferencesSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  /**
   * Get customer notification preferences
   */
  getPreferences(): Observable<{ success: boolean; data: NotificationPreferences }> {
    return this.http.get<{ success: boolean; data: NotificationPreferences }>(
      `${this.apiUrl}/preferences`
    ).pipe(
      tap(response => {
        if (response.success) {
          this.preferencesSubject.next(response.data);
        }
      })
    );
  }
  
  /**
   * Update notification preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): Observable<{ success: boolean; message: string; data: NotificationPreferences }> {
    return this.http.put<{ success: boolean; message: string; data: NotificationPreferences }>(
      `${this.apiUrl}/preferences`,
      preferences
    ).pipe(
      tap(response => {
        if (response.success) {
          this.preferencesSubject.next(response.data);
        }
      })
    );
  }
  
  /**
   * Get notification history
   */
  getNotificationHistory(page: number = 1, limit: number = 20, filters?: { type?: string; status?: string }): Observable<{
    success: boolean;
    data: {
      logs: NotificationLog[];
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
    
    return this.http.get<{
      success: boolean;
      data: {
        logs: NotificationLog[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>(`${this.apiUrl}/history`, { params });
  }
  
  /**
   * Get notification statistics
   */
  getStats(): Observable<{ success: boolean; data: NotificationStats }> {
    return this.http.get<{ success: boolean; data: NotificationStats }>(
      `${this.apiUrl}/admin/dashboard`
    );
  }
  
  /**
   * Get current preferences value
   */
  getCurrentPreferences(): NotificationPreferences | null {
    return this.preferencesSubject.value;
  }
}
