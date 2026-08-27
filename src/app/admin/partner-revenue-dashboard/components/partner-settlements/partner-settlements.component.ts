import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerRevenueService } from '../../../../services/partner-revenue.service';
import { PartnerSM, PartnerSettlementSM, PartnerMonthlyRowSM } from '../../../../models/service-models/app/v1/partner-revenue-s-m';

@Component({
  selector: 'app-partner-settlements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-settlements.component.html',
  styleUrl: '../../partner-revenue.scss',
})
export class PartnerSettlementsComponent implements OnInit {
  partners: PartnerSM[] = [];
  items: PartnerSettlementSM[] = [];
  monthly: PartnerMonthlyRowSM[] = [];
  meta: { paymentMethods: string[] } | null = null;
  partnerId?: number;
  periodMonth = '';
  transactionId = '';
  status = 'active';
  total = 0;
  isLoading = false;
  error = '';
  success = '';
  showForm = false;
  reverseId: number | null = null;
  reverseReason = '';
  form: any = this.emptyForm();
  outstanding = 0;

  constructor(public api: PartnerRevenueService) {}

  async ngOnInit(): Promise<void> {
    const [p, meta] = await Promise.all([this.api.getPartners(), this.api.getMeta()]);
    if (!p.isError) this.partners = p.successData || [];
    if (!meta.isError) this.meta = meta.successData;
    if (this.partners.length) this.partnerId = this.partners[0].id;
    await this.load();
  }

  emptyForm() {
    const today = new Date().toISOString().slice(0, 10);
    return { partnerId: this.partnerId, periodMonth: '', paymentDate: today, amountPaid: 0, paymentMethod: 'Bank Transfer', transactionId: '', bankReference: '', notes: '', attachmentUrl: '' };
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      const resp = await this.api.getSettlements({ partnerId: this.partnerId, periodMonth: this.periodMonth, transactionId: this.transactionId, status: this.status });
      if (resp.isError) this.error = resp.errorData?.displayMessage || 'Failed to load settlements';
      else { this.items = resp.successData?.items || []; this.total = resp.successData?.total || 0; }
    } finally { this.isLoading = false; }
  }

  async openForm(): Promise<void> {
    this.form = this.emptyForm();
    this.form.partnerId = this.partnerId;
    this.showForm = true;
    await this.refreshOutstanding();
  }

  async refreshOutstanding(): Promise<void> {
    if (!this.form.partnerId || !this.form.periodMonth) { this.outstanding = 0; return; }
    const year = Number(String(this.form.periodMonth).slice(0, 4));
    const resp = await this.api.getMonthlyRevenue({ partnerId: this.form.partnerId, year });
    const row = (resp.successData?.rows || []).find((r) => r.month === this.form.periodMonth);
    this.outstanding = row?.outstanding || 0;
    if (!this.form.amountPaid) this.form.amountPaid = this.outstanding;
  }

  async save(): Promise<void> {
    const resp = await this.api.recordSettlement(this.form);
    if (resp.isError) this.error = resp.errorData?.displayMessage || 'Could not record payment';
    else { this.success = 'Settlement recorded'; this.showForm = false; await this.load(); }
  }

  async confirmReverse(): Promise<void> {
    if (!this.reverseId) return;
    const resp = await this.api.reverseSettlement(this.reverseId, { reason: this.reverseReason });
    if (resp.isError) this.error = resp.errorData?.displayMessage || 'Reverse failed';
    else { this.success = 'Settlement reversed (kept for audit)'; this.reverseId = null; await this.load(); }
  }
}
