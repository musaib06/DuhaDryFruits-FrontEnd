import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="logs-container">
      <h2>Notification Logs</h2>
      <p>View detailed logs of all notification deliveries.</p>
      
      <div class="filters">
        <select [(ngModel)]="filterType">
          <option value="">All Types</option>
          <option value="push">Push</option>
        </select>
        <select [(ngModel)]="filterStatus">
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <table class="logs-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Recipient</th>
            <th>Template</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of logs">
            <td>{{ log.createdAt | date:'short' }}</td>
            <td>{{ log.type }}</td>
            <td>{{ log.recipient }}</td>
            <td>{{ log.template }}</td>
            <td>
              <span class="status" [class]="log.status">{{ log.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .logs-container {
      padding: 1.5rem;
    }
    h2 {
      margin-bottom: 0.5rem;
    }
    .filters {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }
    .filters select {
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .logs-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    .logs-table th,
    .logs-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .logs-table th {
      background: #f5f5f5;
      font-weight: 600;
    }
    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      text-transform: uppercase;
    }
    .status.delivered {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status.sent {
      background: #e3f2fd;
      color: #1565c0;
    }
    .status.failed {
      background: #ffebee;
      color: #c62828;
    }
  `]
})
export class LogsComponent {
  filterType = '';
  filterStatus = '';
  
  logs = [
    { createdAt: new Date(), type: 'push', recipient: 'device-abc123', template: 'order_placed', status: 'delivered' },
    { createdAt: new Date(Date.now() - 3600000), type: 'push', recipient: 'device-def456', template: 'promo_sale', status: 'sent' },
    { createdAt: new Date(Date.now() - 7200000), type: 'push', recipient: 'device-ghi789', template: 'order_shipped', status: 'delivered' },
    { createdAt: new Date(Date.now() - 10800000), type: 'push', recipient: 'device-jkl012', template: 'welcome', status: 'failed' }
  ];
}
