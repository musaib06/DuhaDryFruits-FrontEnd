import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notification-dashboard',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="notification-content">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .notification-content {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background: #f5f5f5;
    }
  `]
})
export class NotificationDashboardComponent {}
