import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BulkOrderService } from '../../../../services/bulk-order.service';
import { BulkOrderSM } from '../../../../models/service-models/app/v1/bulk-order-s-m';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'app-bulk-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bulk-order-detail.component.html',
})
export class BulkOrderDetailComponent implements OnInit {
  order: BulkOrderSM | null = null;
  isLoading = false;
  remarks = '';
  discount = 0;
  freight = 0;
  tax = 0;
  shipData = { courier: '', trackingNumber: '', invoiceNumber: '' };

  constructor(
    private route: ActivatedRoute,
    private bulkOrderService: BulkOrderService,
    private commonService: CommonService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((p) => this.load(Number(p['id'])));
  }

  async load(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const resp = await this.bulkOrderService.getBulkOrderById(id);
      if (!resp.isError) {
        this.order = resp.successData;
        this.discount = Number(this.order?.discount || 0);
        this.freight = Number(this.order?.freight || 0);
        this.tax = Number(this.order?.tax || 0);
      }
    } finally {
      this.isLoading = false;
    }
  }

  async approve(): Promise<void> {
    if (!this.order?.id) return;
    const resp = await this.bulkOrderService.approve(this.order.id, {
      remarks: this.remarks,
      discount: this.discount,
      freight: this.freight,
      tax: this.tax,
    });
    if (!resp.isError) {
      this.commonService.showSweetAlertToast({ title: 'Approved', icon: 'success' });
      this.load(this.order.id);
    }
  }

  async reject(): Promise<void> {
    if (!this.order?.id) return;
    const resp = await this.bulkOrderService.reject(this.order.id, { reason: this.remarks });
    if (!resp.isError) {
      this.commonService.showSweetAlertToast({ title: 'Rejected', icon: 'info' });
      this.load(this.order.id);
    }
  }

  async generatePayment(): Promise<void> {
    if (!this.order?.id) return;
    const resp = await this.bulkOrderService.generatePaymentLink(this.order.id);
    if (!resp.isError) {
      this.commonService.showSweetAlertToast({ title: 'Payment link generated', icon: 'success' });
      this.load(this.order.id);
    } else {
      this.commonService.showSweetAlertToast({ title: 'Error', text: resp.errorData.displayMessage, icon: 'error' });
    }
  }

  async ship(): Promise<void> {
    if (!this.order?.id) return;
    const resp = await this.bulkOrderService.ship(this.order.id, this.shipData);
    if (!resp.isError) {
      this.commonService.showSweetAlertToast({ title: 'Shipped', icon: 'success' });
      this.load(this.order.id);
    }
  }

  async markDelivered(): Promise<void> {
    if (!this.order?.id) return;
    const resp = await this.bulkOrderService.updateTracking(this.order.id, { status: 'delivered' });
    if (!resp.isError) {
      this.commonService.showSweetAlertToast({ title: 'Delivered', icon: 'success' });
      this.load(this.order.id);
    }
  }

  async startProcessing(): Promise<void> {
    if (!this.order?.id) return;
    await this.bulkOrderService.updateTracking(this.order.id, { status: 'processing' });
    this.load(this.order.id);
  }
}
