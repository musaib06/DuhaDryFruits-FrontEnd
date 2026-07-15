/**
 * Notification Module - Frontend
 * Angular module for customer notification features
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Standalone Components
import { NotificationSettingsComponent } from './components/notification-settings/notification-settings.component';
import { NotificationHistoryComponent } from './components/notification-history/notification-history.component';
import { PushNotificationPromptComponent } from './components/push-notification-prompt/push-notification-prompt.component';

// Services
import { NotificationService } from './services/notification.service';
import { PushNotificationService } from './services/push-notification.service';

// Guards
import { AuthGuard } from '../../app/guard/auth.guard';

const routes: Routes = [
  {
    path: 'settings',
    component: NotificationSettingsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'history',
    component: NotificationHistoryComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    NotificationSettingsComponent,
    NotificationHistoryComponent,
    PushNotificationPromptComponent
  ],
  providers: [
    NotificationService,
    PushNotificationService
  ],
  exports: [
    PushNotificationPromptComponent
  ]
})
export class NotificationModule { }
