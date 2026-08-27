import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerRevenueService } from '../../../../services/partner-revenue.service';
import { ExportService } from '../../../../services/export.service';
import { PartnerSM } from '../../../../models/service-models/app/v1/partner-revenue-s-m';

@Component({
  selector: 'app-partner-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-reports.component.html',
  styleUrl: '../../partner-revenue.scss',
})
export class PartnerReportsComponent implements OnInit {
  partners: PartnerSM[] = [];
  partnerId?: number;
  year = new Date().getFullYear();
  dateFilter = 'month';
  startDate = '';
  endDate = '';
  daily: any[] = [];
  monthly: any[] = [];
  ledger: any[] = [];
  statement: any = null;
  isLoading = false;
  error = '';

  constructor(public api: PartnerRevenueService, private exportService: ExportService) {}

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
      const [d, m, l, s] = await Promise.all([
        this.api.getDailyRevenue({ partnerId: this.partnerId, dateFilter: this.dateFilter, startDate: this.startDate, endDate: this.endDate }),
        this.api.getMonthlyRevenue({ partnerId: this.partnerId, year: this.year }),
        this.api.getLedger({ partnerId: this.partnerId, year: this.year }),
        this.api.getStatement({ partnerId: this.partnerId, year: this.year, startDate: this.startDate, endDate: this.endDate }),
      ]);
      if (d.isError || m.isError || l.isError || s.isError) this.error = 'Could not load one or more reports';
      this.daily = d.successData?.rows || [];
      this.monthly = m.successData?.rows || [];
      this.ledger = l.successData?.entries || [];
      this.statement = s.successData;
    } finally { this.isLoading = false; }
  }

  exportDaily(kind: 'pdf' | 'excel'): void {
    const cols = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Revenue', dataKey: 'revenue' },
      { header: '%', dataKey: 'percent' },
      { header: 'Partner share', dataKey: 'partnerShare' },
      { header: 'Paid', dataKey: 'paymentsMade' },
      { header: 'Outstanding', dataKey: 'outstanding' },
    ];
    if (kind === 'pdf') this.exportService.exportToPDF(this.daily, cols, 'Partner Daily Revenue', 'partner_daily');
    else this.exportService.exportToExcel(this.daily, cols, 'partner_daily');
  }

  exportMonthly(kind: 'pdf' | 'excel'): void {
    const cols = [
      { header: 'Month', dataKey: 'month' },
      { header: 'Revenue', dataKey: 'revenue' },
      { header: '%', dataKey: 'percentLabel' },
      { header: 'Partner share', dataKey: 'partnerShare' },
      { header: 'Paid', dataKey: 'paid' },
      { header: 'Outstanding', dataKey: 'outstanding' },
      { header: 'Status', dataKey: 'status' },
    ];
    if (kind === 'pdf') this.exportService.exportToPDF(this.monthly, cols, 'Partner Monthly Revenue', 'partner_monthly');
    else this.exportService.exportToExcel(this.monthly, cols, 'partner_monthly');
  }

  exportLedger(kind: 'pdf' | 'excel'): void {
    const cols = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Period', dataKey: 'period' },
      { header: 'Revenue', dataKey: 'revenue' },
      { header: 'Share', dataKey: 'partnerShare' },
      { header: 'Paid', dataKey: 'paid' },
      { header: 'Outstanding', dataKey: 'outstanding' },
      { header: 'Txn ID', dataKey: 'transactionId' },
    ];
    if (kind === 'pdf') this.exportService.exportToPDF(this.ledger, cols, 'Partner Ledger', 'partner_ledger');
    else this.exportService.exportToExcel(this.ledger, cols, 'partner_ledger');
  }

  exportStatement(): void {
    this.exportService.exportPartnerStatementPDF(this.statement || {}, 'partner_statement');
  }
}
