import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-bulk-orders-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="bulk-admin-shell">
      <nav class="sub-nav">
        <a routerLink="/admin/bulk-orders/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/admin/bulk-orders/requests" routerLinkActive="active">Requests</a>
      </nav>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .bulk-admin-shell { padding: 0; }
    .sub-nav {
      display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;
      a {
        padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none;
        color: #435a34; border: 1px solid #ddd; font-weight: 500;
        &.active { background: #435a34; color: #fff; border-color: #435a34; }
      }
    }
  `],
})
export class BulkOrdersShellComponent {}
