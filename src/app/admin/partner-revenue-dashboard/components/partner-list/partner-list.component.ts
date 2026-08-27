import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerRevenueService } from '../../../../services/partner-revenue.service';
import { PartnerSM } from '../../../../models/service-models/app/v1/partner-revenue-s-m';

@Component({
  selector: 'app-partner-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-list.component.html',
  styleUrl: '../../partner-revenue.scss',
})
export class PartnerListComponent implements OnInit {
  partners: PartnerSM[] = [];
  isLoading = false;
  error = '';
  success = '';
  showForm = false;
  showPercent = false;
  editing: PartnerSM | null = null;
  form: any = this.emptyForm();
  percentForm = { sharePercent: 6, effectiveFrom: '', reason: '' };

  constructor(public api: PartnerRevenueService) {}

  ngOnInit(): void { this.load(); }

  emptyForm() {
    return { partnerName: '', email: '', phone: '', address: '', notes: '', sharePercent: 6, effectiveFrom: '', status: 'Active' };
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      const resp = await this.api.getPartners();
      if (resp.isError) this.error = resp.errorData?.displayMessage || 'Failed to load partners';
      else this.partners = resp.successData || [];
    } finally { this.isLoading = false; }
  }

  openCreate(): void {
    this.editing = null;
    this.form = this.emptyForm();
    this.showForm = true;
  }

  openEdit(p: PartnerSM): void {
    this.editing = p;
    this.form = { ...p };
    this.showForm = true;
  }

  openPercent(p: PartnerSM): void {
    this.editing = p;
    this.percentForm = { sharePercent: Number(p.sharePercent), effectiveFrom: '', reason: '' };
    this.showPercent = true;
  }

  async save(): Promise<void> {
    this.error = '';
    const resp = this.editing?.id
      ? await this.api.updatePartner(this.editing.id, this.form)
      : await this.api.createPartner(this.form);
    if (resp.isError) this.error = resp.errorData?.displayMessage || 'Save failed';
    else { this.success = 'Partner saved'; this.showForm = false; await this.load(); }
  }

  async toggleStatus(p: PartnerSM): Promise<void> {
    const status = p.status === 'Active' ? 'Inactive' : 'Active';
    const resp = await this.api.updatePartner(p.id!, { status });
    if (resp.isError) this.error = resp.errorData?.displayMessage || 'Update failed';
    else await this.load();
  }

  async savePercent(): Promise<void> {
    if (!this.editing?.id) return;
    const resp = await this.api.changePercentage(this.editing.id, this.percentForm);
    if (resp.isError) this.error = resp.errorData?.displayMessage || 'Percentage change failed';
    else { this.success = 'Percentage updated. Historical months keep the old rate.'; this.showPercent = false; await this.load(); }
  }
}
