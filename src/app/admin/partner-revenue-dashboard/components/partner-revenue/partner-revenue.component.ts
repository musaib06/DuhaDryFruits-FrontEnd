import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerRevenueService } from '../../../../services/partner-revenue.service';
import { PartnerSM, PartnerDailyRowSM, PartnerMonthlyRowSM } from '../../../../models/service-models/app/v1/partner-revenue-s-m';

@Component({
  selector: 'app-partner-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-revenue.component.html',
  styleUrl: '../../partner-revenue.scss',
})
export class PartnerRevenueComponent implements OnInit {
  partners: PartnerSM[] = [];
  partnerId?: number;
  year = new Date().getFullYear();
  dateFilter = 'month';
  startDate = '';
  endDate = '';
  status = '';
  daily: PartnerDailyRowSM[] = [];
  monthly: PartnerMonthlyRowSM[] = [];
  totals: any = {};
  drilldown: any = null;
  isLoading = false;
  error = '';
  tab: 'daily' | 'monthly' = 'monthly';

  constructor(public api: PartnerRevenueService) {}

  async ngOnInit(): Promise<void> {
    const resp = await this.api.getPartners();
    if (!resp.isError) this.partners = resp.successData || [];
    if (this.partners.length) this.partnerId = this.partners[0].id;
    await this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      if (this.tab === 'daily') {
        const resp = await this.api.getDailyRevenue({
          partnerId: this.partnerId, dateFilter: this.dateFilter, startDate: this.startDate, endDate: this.endDate,
        });
        if (resp.isError) this.error = resp.errorData?.displayMessage || 'Failed';
        else { this.daily = resp.successData?.rows || []; this.totals = resp.successData?.totals || {}; }
      } else {
        const resp = await this.api.getMonthlyRevenue({ partnerId: this.partnerId, year: this.year, status: this.status });
        if (resp.isError) this.error = resp.errorData?.displayMessage || 'Failed';
        else this.monthly = resp.successData?.rows || [];
      }
    } finally { this.isLoading = false; }
  }

  async openDay(date: string): Promise<void> {
    const resp = await this.api.getDrilldown({ partnerId: this.partnerId, date });
    if (!resp.isError) this.drilldown = resp.successData;
  }

  async openMonth(month: string): Promise<void> {
    const resp = await this.api.getDrilldown({ partnerId: this.partnerId, month });
    if (!resp.isError) this.drilldown = resp.successData;
  }

  statusClass(status: string): string {
    if (status === 'Paid') return 'badge-paid';
    if (status === 'Partially Paid') return 'badge-partial';
    return 'badge-pending';
  }
}
