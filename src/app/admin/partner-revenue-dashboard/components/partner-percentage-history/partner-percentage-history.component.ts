import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerRevenueService } from '../../../../services/partner-revenue.service';
import { ExportService } from '../../../../services/export.service';
import { PartnerSM, PartnerPercentageHistorySM } from '../../../../models/service-models/app/v1/partner-revenue-s-m';

@Component({
  selector: 'app-partner-percentage-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-percentage-history.component.html',
  styleUrl: '../../partner-revenue.scss',
})
export class PartnerPercentageHistoryComponent implements OnInit {
  partners: PartnerSM[] = [];
  rows: PartnerPercentageHistorySM[] = [];
  partnerId: number | '' = '';
  isLoading = false;
  error = '';

  constructor(public api: PartnerRevenueService, private exportService: ExportService) {}

  async ngOnInit(): Promise<void> {
    const resp = await this.api.getPartners();
    if (!resp.isError) this.partners = resp.successData || [];
    await this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      const resp = await this.api.getPercentageHistory(this.partnerId ? { partnerId: this.partnerId } : {});
      if (resp.isError) this.error = resp.errorData?.displayMessage || 'Failed to load history';
      else this.rows = resp.successData || [];
    } finally { this.isLoading = false; }
  }

  export(kind: 'pdf' | 'excel'): void {
    const cols = [
      { header: 'Partner', dataKey: 'partnerName' },
      { header: 'Old %', dataKey: 'oldPercent' },
      { header: 'New %', dataKey: 'newPercent' },
      { header: 'Effective From', dataKey: 'effectiveFrom' },
      { header: 'Reason', dataKey: 'reason' },
      { header: 'Changed At', dataKey: 'changedAt' },
    ];
    const data = this.rows.map((r) => ({ ...r, partnerName: r.partner?.partnerName || '' }));
    if (kind === 'pdf') this.exportService.exportToPDF(data, cols, 'Percentage History', 'partner_percentage_history');
    else this.exportService.exportToExcel(data, cols, 'partner_percentage_history');
  }
}
