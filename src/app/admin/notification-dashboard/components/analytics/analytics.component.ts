import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="analytics-container">
      <h2>Notification Analytics</h2>
      <p>View delivery statistics and campaign performance.</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalSent | number }}</div>
          <div class="stat-label">Total Sent</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.delivered | number }}</div>
          <div class="stat-label">Delivered</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.read | number }}</div>
          <div class="stat-label">Read</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.failed | number }}</div>
          <div class="stat-label">Failed</div>
        </div>
      </div>

      <div class="chart-placeholder">
        <p>Charts and detailed analytics coming soon...</p>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 1.5rem;
    }
    h2 {
      margin-bottom: 0.5rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .stat-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      color: #1976d2;
    }
    .stat-label {
      color: #666;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .chart-placeholder {
      margin-top: 2rem;
      padding: 3rem;
      background: #f5f5f5;
      border-radius: 8px;
      text-align: center;
      color: #666;
    }
  `]
})
export class AnalyticsComponent {
  stats = {
    totalSent: 15420,
    delivered: 14890,
    read: 8750,
    failed: 530
  };
}
