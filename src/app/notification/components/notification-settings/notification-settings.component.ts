import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { NotificationPreferences } from '../../models/notification.models';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class NotificationSettingsComponent implements OnInit {
  preferencesForm: FormGroup;
  preferences: NotificationPreferences | null = null;
  isLoading = false;
  isSaving = false;
  message: { type: 'success' | 'error'; text: string } | null = null;
  
  // Push notification status
  pushSupported = false;
  pushPermission: NotificationPermission = 'default';
  
  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private pushService: PushNotificationService
  ) {
    this.preferencesForm = this.fb.group({
      whatsappNotifications: [true],
      pushNotifications: [true],
      emailNotifications: [true],
      marketingNotifications: [false],
      orderUpdates: [true],
      promotionalOffers: [false],
      deliveryUpdates: [true],
      cartReminders: [true]
    });
  }
  
  ngOnInit(): void {
    this.pushSupported = this.pushService.isSupported();
    this.pushPermission = Notification.permission;
    this.loadPreferences();
  }
  
  loadPreferences(): void {
    this.isLoading = true;
    this.notificationService.getPreferences().subscribe({
      next: (response) => {
        this.preferences = response.data;
        this.preferencesForm.patchValue(response.data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading preferences:', error);
        this.message = { type: 'error', text: 'Failed to load preferences' };
        this.isLoading = false;
      }
    });
  }
  
  onSubmit(): void {
    if (this.preferencesForm.invalid) return;
    
    this.isSaving = true;
    this.message = null;
    
    const updates = this.preferencesForm.value;
    
    this.notificationService.updatePreferences(updates).subscribe({
      next: (response) => {
        this.message = { type: 'success', text: response.message };
        this.isSaving = false;
        
        // Handle push notification registration
        if (updates.pushNotifications && this.pushSupported) {
          this.requestPushPermission();
        }
      },
      error: (error) => {
        console.error('Error saving preferences:', error);
        this.message = { type: 'error', text: 'Failed to save preferences' };
        this.isSaving = false;
      }
    });
  }
  
  async requestPushPermission(): Promise<void> {
    if (this.pushPermission !== 'granted') {
      const token = await this.pushService.requestPermission();
      if (token) {
        await this.registerPushToken(token);
      }
    }
  }
  
  async registerPushToken(token: string): Promise<void> {
    const subscription = {
      token,
      deviceType: 'web' as const,
      browser: this.getBrowserName(),
      os: this.getOSName()
    };
    
    this.pushService.registerToken(subscription).subscribe({
      next: () => console.log('Push token registered'),
      error: (error) => console.error('Failed to register push token:', error)
    });
  }
  
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
  
  private getOSName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
}
