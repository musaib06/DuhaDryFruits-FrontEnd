import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BulkOrderService } from '../../../../services/bulk-order.service';
import { BulkOrderSM } from '../../../../models/service-models/app/v1/bulk-order-s-m';

@Component({
  selector: 'app-bulk-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bulk-order-list.component.html',
})
export class BulkOrderListComponent implements OnInit {
  orders: BulkOrderSM[] = [];
  isLoading = false;
  search = '';
  status = '';
  page = 1;
  pageSize = 15;
  totalCount = 0;

  readonly statuses = [
    '', 'pending_approval', 'approved', 'rejected', 'changes_requested',
    'payment_pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled',
  ];

  constructor(private bulkOrderService: BulkOrderService) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    try {
      const resp = await this.bulkOrderService.getAllBulkOrders({
        pageNo: this.page,
        pageSize: this.pageSize,
        status: this.status || undefined,
        search: this.search || undefined,
      });
      if (!resp.isError && resp.successData) {
        this.orders = resp.successData.items;
        this.totalCount = resp.successData.totalCount;
      }
    } finally {
      this.isLoading = false;
    }
  }
}
