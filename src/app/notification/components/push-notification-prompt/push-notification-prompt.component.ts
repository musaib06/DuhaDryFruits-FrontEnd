import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PushNotificationService } from '../../services/push-notification.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-push-notification-prompt',
  templateUrl: './push-notification-prompt.component.html',
  styleUrls: ['./push-notification-prompt.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PushNotificationPromptComponent implements OnInit, OnDestroy {
  showPrompt = false;
  isLoading = false;
  hasPromptedBefore = false;
  
  private preferencesSubscription: Subscription | null = null;
  
  constructor(
    private pushService: PushNotificationService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    // Check if push notifications are supported and not already enabled
    this.checkAndShowPrompt();
  }
  
  ngOnDestroy(): void {
    if (this.preferencesSubscription) {
      this.preferencesSubscription.unsubscribe();
    }
  }
  
  private checkAndShowPrompt(): void {
    // Check local storage to see if we've prompted before
    const prompted = localStorage.getItem('pushNotificationPrompted');
    this.hasPromptedBefore = prompted === 'true';
    
    // Check if push is supported
    if (!this.pushService.isSupported()) {
      return;
    }
    
    // Check current permission status
    if (this.pushService.isPermissionGranted() || this.pushService.isPermissionDenied()) {
      return;
    }
    
    // Check user preferences
    this.preferencesSubscription = this.notificationService.preferences$.subscribe(preferences => {
      if (preferences && preferences.pushNotifications) {
        // User already has push enabled in preferences, don't show prompt
        return;
      }
      
      // Show prompt after a delay if we haven't prompted before
      if (!this.hasPromptedBefore) {
        setTimeout(() => {
          this.showPrompt = true;
        }, 5000); // Show after 5 seconds
      }
    });
    
    // Load preferences if not already loaded
    if (!this.notificationService.getCurrentPreferences()) {
      this.notificationService.getPreferences().subscribe();
    }
  }
  
  async onEnable(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Request permission and get token
      const token = await this.pushService.requestPermission();
      
      if (token) {
        // Register token with backend
        await this.registerToken(token);
        
        // Update preferences
        await this.updatePreferences();
        
        this.showPrompt = false;
        this.hasPromptedBefore = true;
        localStorage.setItem('pushNotificationPrompted', 'true');
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private async registerToken(token: string): Promise<void> {
    const subscription = {
      token,
      deviceType: 'web' as const,
      browser: this.getBrowserName(),
      os: this.getOSName()
    };
    
    return new Promise((resolve, reject) => {
      this.pushService.registerToken(subscription).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }
  
  private async updatePreferences(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.notificationService.updatePreferences({
        pushNotifications: true
      }).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }
  
  onDismiss(): void {
    this.showPrompt = false;
    this.hasPromptedBefore = true;
    localStorage.setItem('pushNotificationPrompted', 'true');
  }
  
  private getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
  
  private getOSName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
}
