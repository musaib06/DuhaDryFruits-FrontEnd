import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BaseComponent } from '../../../../../base.component';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { BulkOrderService } from '../../../../../services/bulk-order.service';
import { BulkOrderSM } from '../../../../../models/service-models/app/v1/bulk-order-s-m';
import { MyBulkOrdersViewModel } from '../../../../../models/view/end-user/my-bulk-orders.viewmodel';

@Component({
  selector: 'app-my-bulk-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-bulk-orders.html',
  styleUrl: './my-bulk-orders.scss',
})
export class MyBulkOrders extends BaseComponent<MyBulkOrdersViewModel> {
  email = '';
  orders: BulkOrderSM[] = [];
  selectedOrder: BulkOrderSM | null = null;
  isLoading = false;
  hasSearched = false;
  statusFilter = '';
  page = 1;
  pageSize = 10;
  totalCount = 0;

  readonly statusTabs = [
    { value: '', label: 'All' },
    { value: 'pending_approval', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'payment_pending', label: 'Payment Due' },
    { value: 'paid', label: 'Paid' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private bulkOrderService: BulkOrderService,
  ) {
    super(commonService, logHandler);
    this.viewModel = new MyBulkOrdersViewModel();
  }

  async search(): Promise<void> {
    if (!this.email.trim()) {
      this._commonService.showSweetAlertToast({ title: 'Email required', icon: 'warning' });
      return;
    }
    this.isLoading = true;
    this.hasSearched = true;
    try {
      const resp = await this.bulkOrderService.getBulkOrdersByEmail(this.email.trim(), this.page, this.pageSize);
      if (resp.isError) {
        this._commonService.showSweetAlertToast({ title: 'Error', text: resp.errorData.displayMessage, icon: 'error' });
        return;
      }
      let items = resp.successData?.items || [];
      if (this.statusFilter) items = items.filter((o) => o.status === this.statusFilter);
      this.orders = items;
      this.totalCount = resp.successData?.totalCount || items.length;
    } finally {
      this.isLoading = false;
    }
  }

  async viewDetails(order: BulkOrderSM): Promise<void> {
    if (!order.id) return;
    const resp = await this.bulkOrderService.getBulkOrderById(order.id);
    if (!resp.isError) this.selectedOrder = resp.successData;
  }

  statusLabel(status?: string): string {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  statusClass(status?: string): string {
    return (status || 'pending').replace(/_/g, '-');
  }

  async cancelOrder(order: BulkOrderSM): Promise<void> {
    if (!order.id || order.status !== 'pending_approval') return;
    const confirmed = await this._commonService.showConfirmationAlert('Cancel Request', 'Cancel this bulk request?', true, 'warning');
    if (!confirmed) return;
    const resp = await this.bulkOrderService.cancel(order.id, 'Cancelled by customer');
    if (!resp.isError) {
      this._commonService.showSweetAlertToast({ title: 'Cancelled', icon: 'success' });
      this.search();
    }
  }
}
