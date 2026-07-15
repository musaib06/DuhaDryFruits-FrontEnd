/**
 * Admin Notification Dashboard Module
 * Module for managing notifications, campaigns, and analytics
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Standalone Components
import { NotificationDashboardComponent } from './components/notification-dashboard/notification-dashboard.component';
import { DashboardStatsComponent } from './components/dashboard-stats/dashboard-stats.component';
import { SendNotificationComponent } from './components/send-notification/send-notification.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { LogsComponent } from './components/logs/logs.component';

// Campaigns/Templates are intentionally not routed here: this admin area is a
// simple FCM push sender. Direct "Send Notification" covers the use case, so
// the campaign scheduler and template manager are omitted to keep the UI focused.
const routes: Routes = [
  {
    path: '',
    component: NotificationDashboardComponent,
    children: [
      { path: '', redirectTo: 'stats', pathMatch: 'full' },
      { path: 'stats', component: DashboardStatsComponent },
      { path: 'send', component: SendNotificationComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'logs', component: LogsComponent }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    NotificationDashboardComponent,
    DashboardStatsComponent,
    SendNotificationComponent,
    AnalyticsComponent,
    LogsComponent
  ]
  // AdminNotificationService is providedIn: 'root', no need to add here
})
export class NotificationDashboardModule { }
