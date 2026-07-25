import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BulkOrderService } from '../../../../services/bulk-order.service';
import { BulkOrderDashboardData } from '../../../../models/service-models/app/v1/bulk-order-s-m';

@Component({
  selector: 'app-bulk-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './bulk-dashboard.component.html',
  styleUrl: './bulk-dashboard.component.scss',
})
export class BulkDashboardComponent implements OnInit {
  data: BulkOrderDashboardData | null = null;
  isLoading = false;
  error = '';

  public pieChartType: ChartType = 'pie';
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
    },
  };

  public barChartType: ChartType = 'bar';
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
    plugins: { legend: { display: false } },
  };

  constructor(private bulkOrderService: BulkOrderService) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      const resp = await this.bulkOrderService.getDashboard();
      if (resp.isError) {
        this.error = resp.errorData.displayMessage;
      } else {
        this.data = resp.successData;
      }
    } finally {
      this.isLoading = false;
    }
  }

  formatCurrency(n?: number): string {
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
  }

  get statusPieData(): ChartConfiguration<'pie'>['data'] {
    const charts = this.data?.charts;
    const breakdown = charts?.statusBreakdown ?? [];
    const labels = breakdown.map((s) => (s.status || '').replace(/_/g, ' '));
    const values = breakdown.map((s) => Number(s.count) || 0);
    return {
      labels: labels.length ? labels : ['No data'],
      datasets: [
        {
          data: values.length ? values : [1],
          backgroundColor: [
            '#ffc107', '#28a745', '#dc3545', '#17a2b8', '#6f42c1',
            '#20c997', '#fd7e14', '#6610f2', '#e83e8c', '#6c757d',
          ],
        },
      ],
    };
  }

  get monthlyBarData(): ChartConfiguration<'bar'>['data'] {
    const rows = this.data?.charts?.monthlyRequests ?? [];
    const labels = rows.map((r) => {
      const d = new Date(r.month);
      return isNaN(d.getTime()) ? String(r.month) : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    });
    const values = rows.map((r) => Number(r.count) || 0);
    return {
      labels: labels.length ? labels : ['—'],
      datasets: [
        {
          data: values.length ? values : [0],
          label: 'Requests',
          backgroundColor: '#435a34',
          borderRadius: 6,
        },
      ],
    };
  }

  get topProducts(): Array<{ productName: string; totalQty: string | number }> {
    return this.data?.charts?.topProducts ?? [];
  }

  get topCustomers(): Array<{ companyName: string; orderCount: string | number; totalSpent: string | number }> {
    return this.data?.charts?.topCustomers ?? [];
  }
}
