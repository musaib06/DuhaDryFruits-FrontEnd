import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { PartnerRevenueService } from '../../../../services/partner-revenue.service';
import { PartnerSM, PartnerDashboardSM } from '../../../../models/service-models/app/v1/partner-revenue-s-m';

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './partner-dashboard.component.html',
  styleUrl: '../../partner-revenue.scss',
})
export class PartnerDashboardComponent implements OnInit {
  partners: PartnerSM[] = [];
  partnerId?: number;
  data: PartnerDashboardSM | null = null;
  isLoading = false;
  error = '';
  lineChartType: ChartType = 'line';
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };

  constructor(public api: PartnerRevenueService) {}

  async ngOnInit(): Promise<void> {
    await this.loadPartners();
    await this.load();
  }

  async loadPartners(): Promise<void> {
    const resp = await this.api.getPartners();
    if (!resp.isError) this.partners = resp.successData || [];
    if (!this.partnerId && this.partners.length) this.partnerId = this.partners[0].id;
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      const resp = await this.api.getDashboard(this.partnerId);
      if (resp.isError) this.error = resp.errorData?.displayMessage || 'Failed to load dashboard';
      else this.data = resp.successData;
    } finally {
      this.isLoading = false;
    }
  }

  get lineChartData(): ChartConfiguration<'line'>['data'] {
    const rows = this.data?.trend || [];
    return {
      labels: rows.map((r) => r.date),
      datasets: [
        { data: rows.map((r) => r.revenue), label: 'Revenue', borderColor: '#3a4f2e', backgroundColor: 'rgba(58,79,46,0.12)', fill: true, tension: 0.3 },
        { data: rows.map((r) => r.partnerShare), label: 'Partner share', borderColor: '#b8954a', backgroundColor: 'rgba(184,149,74,0.12)', fill: true, tension: 0.3 },
      ],
    };
  }
}
