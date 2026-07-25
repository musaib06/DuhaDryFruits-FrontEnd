import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseComponent } from '../../../../../../base.component';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { OrderService } from '../../../../../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderSM } from '../../../../../../models/service-models/app/v1/order-s-m';
import { ProductUtils } from '../../../../../../utils/product.utils';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
  standalone: true
})
export class OrderDetailComponent extends BaseComponent<any> implements OnInit {
  protected _logHandler: LogHandlerService;
  order?: OrderSM;
  loading = false;
  error = '';

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = {};
  }

  async ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      await this.loadOrder(parseInt(orderId));
    } else {
      this.error = 'Invalid order ID';
    }
  }

  async loadOrder(orderId: number) {
    try {
      this.loading = true;
      this._commonService.presentLoading();
      
      const response = await this.orderService.getOrderById(orderId);
      
      if (response.isError) {
        this.error = response.errorData?.displayMessage || 'Failed to load order';
        await this._logHandler.logObject(response.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: this.error,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        this.order = response.successData;
      }
    } catch (error: any) {
      this.error = error.message || 'An error occurred';
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: this.error,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      this.loading = false;
      this._commonService.dismissLoader();
    }
  }

  async updateStatus(newStatus: string) {
    if (!this.order) return;

    try {
      this._commonService.presentLoading();
      
      const response = await this.orderService.updateOrderStatus(this.order.id, newStatus);
      
      if (response.isError) {
        await this._logHandler.logObject(response.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: response.errorData?.displayMessage || 'Failed to update order status',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        const payload = response.successData as { order?: { status?: string }; status?: string };
        const saved = payload?.order?.status ?? payload?.status ?? newStatus;
        this.order.status = saved;
        await this.loadOrder(this.order.id);
        this._commonService.showSweetAlertToast({
          title: 'Success',
          text: 'Order status updated successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }
    } catch (error: any) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'An error occurred while updating order status',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  getStatusBadgeClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'paid' || statusLower === 'delivered') return 'bg-success';
    if (statusLower === 'shipped' || statusLower === 'processing') return 'bg-warning text-dark';
    if (statusLower === 'failed' || statusLower === 'cancelled') return 'bg-danger';
    if (statusLower === 'created' || statusLower === 'payment_pending') return 'bg-info';
    return 'bg-secondary';
  }

  formatVariantSizeAndWeight(item: any): string {
    const v = item?.variant;
    const d = item?.variantDetails;
    return ProductUtils.getDisplayUnit({ ...d, ...v }) || 'N/A';
  }

  formatVariantUnit(item: any): string {
    const v = item?.variant;
    const d = item?.variantDetails;
    const unit = (v?.unitSymbol ?? d?.unitSymbol ?? v?.unitName ?? d?.unitName ?? '').toString();
    return unit || 'N/A';
  }

  formatVariantWeight(item: any): string {
    const v = item?.variant;
    const d = item?.variantDetails;
    return ProductUtils.getDisplayUnit({ ...d, ...v }) || 'N/A';
  }

  /**
   * Determine if invoice should be shown based on order status
   */
  shouldShowInvoice(status: string): boolean {
    const hiddenStatuses = ['failed', 'created'];
    return !hiddenStatuses.includes(status?.toLowerCase());
  }
}

