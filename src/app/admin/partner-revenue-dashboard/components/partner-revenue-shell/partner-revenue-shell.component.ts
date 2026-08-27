import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-partner-revenue-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="pr-admin-shell">
      <nav class="sub-nav">
        <a routerLink="/admin/partner-revenue/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/admin/partner-revenue/partners" routerLinkActive="active">Partners</a>
        <a routerLink="/admin/partner-revenue/revenue" routerLinkActive="active">Revenue</a>
        <a routerLink="/admin/partner-revenue/settlements" routerLinkActive="active">Settlements</a>
        <a routerLink="/admin/partner-revenue/reports" routerLinkActive="active">Reports</a>
        <a routerLink="/admin/partner-revenue/percentage-history" routerLinkActive="active">Percentage History</a>
      </nav>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .sub-nav {
      display: flex; gap: 0.5rem; margin-bottom: 1.25rem; flex-wrap: wrap;
      a {
        padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none;
        color: #3a4f2e; border: 1px solid #ddd; font-weight: 500; font-size: 0.9rem;
        &.active { background: #3a4f2e; color: #fff; border-color: #3a4f2e; }
      }
    }
  `],
})
export class PartnerRevenueShellComponent {}
