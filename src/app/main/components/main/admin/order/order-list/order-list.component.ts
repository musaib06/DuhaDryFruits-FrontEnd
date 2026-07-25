import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../../base.component';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { OrderService } from '../../../../../../services/order.service';
import { CustomerService } from '../../../../../../services/customer.service';
import { ExportService } from '../../../../../../services/export.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaginationComponent } from '../../../../internal/pagination/pagination.component';
import { OrderViewModel } from '../../../../../../models/view/Admin/order.viewmodel';
import { OrderSM } from '../../../../../../models/service-models/app/v1/order-s-m';
import { CustomerDetailSM } from '../../../../../../models/service-models/app/v1/customer-detail-s-m';

@Component({
  selector: 'app-order-list',
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
  standalone: true
})
export class OrderListComponent extends BaseComponent<OrderViewModel> implements OnInit {
  protected _logHandler: LogHandlerService;

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private orderService: OrderService,
    private customerService: CustomerService,
    private exportService: ExportService
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = new OrderViewModel();
    this.viewModel.pagination.PageSize = 20;
  }

  async ngOnInit() {
    await this.loadCustomers();
    await this.loadOrders();
  }

  async loadCustomers() {
    try {
      // Load all customers for dropdown
      const queryFilter = { skip: 0, top: 1000 };
      const response = await this.customerService.getAllPaginatedCustomer({ 
        pagination: { PageNo: 1, PageSize: 1000, totalCount: 0, totalPages: [] },
        customers: []
      } as any);
      if (!response.isError && response.successData) {
        // Handle both array and object with data property
        const customersData = Array.isArray(response.successData) 
          ? response.successData 
          : (response.successData as any).data || [];
        
        this.viewModel.customers = customersData.map((c: CustomerDetailSM) => ({
          id: c.id,
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          fullName: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Unknown'
        }));
      }
    } catch (error: any) {
      console.error('Error loading customers:', error);
    }
  }

  async loadOrders() {
    try {
      this.viewModel.loading = true;
      this._commonService.presentLoading();
      
      const response = await this.orderService.getAllOrders(this.viewModel);
      
      if (response.isError) {
        this.viewModel.error = response.errorData?.displayMessage || 'Failed to load orders';
        await this._logHandler.logObject(response.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: this.viewModel.error,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        // Backend returns { data: [...], total: ..., skip: ..., top: ..., hasMore: ... }
        // Check if successData is an object with 'data' property or directly an array
        let orders: OrderSM[] = [];
        let totalCount = 0;
        
        if (response.successData) {
          // Type guard: check if it's an array
          if (Array.isArray(response.successData)) {
            // Direct array response
            orders = response.successData;
            totalCount = orders.length;
          } else {
            // Type assertion for object response
            const responseData = response.successData as any;
            if (responseData.data && Array.isArray(responseData.data)) {
              // Nested response with data property
              orders = responseData.data;
              totalCount = responseData.total || orders.length;
            } else if (responseData.orders && Array.isArray(responseData.orders)) {
              // Alternative nested structure
              orders = responseData.orders;
              totalCount = responseData.total || orders.length;
            }
          }
        }
        
        this.viewModel.orders = orders;
        this.viewModel.totalCount = totalCount;
        this.viewModel.pagination.totalCount = totalCount;
        this.viewModel.pagination.totalPages = Array.from({ length: Math.ceil(totalCount / this.viewModel.pagination.PageSize) }, (_, i) => i + 1);
        
        if (orders.length > 0) {
          console.log('Orders loaded successfully:', orders.length, 'orders (Total:', totalCount, ')');
        } else {
          console.log('No orders found');
        }
      }
    } catch (error: any) {
      this.viewModel.error = error.message || 'An error occurred';
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: this.viewModel.error,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      this.viewModel.loading = false;
      this._commonService.dismissLoader();
    }
  }

  async onPageChange(pageNo: number) {
    this.viewModel.pagination.PageNo = pageNo;
    await this.loadOrders();
  }

  // Debounce timer for date changes
  private dateChangeTimer: any = null;

  // onDateChange(_event?: any) {
  //   // Clear existing timer
  //   if (this.dateChangeTimer) {
  //     clearTimeout(this.dateChangeTimer);
  //   }
  //   // Debounce date changes to avoid multiple API calls
  //   this.dateChangeTimer = setTimeout(() => {
  //     this.applyFilters();
  //   }, 500);
  // }
  public onDateChange() {
  if (this.dateChangeTimer) {
    clearTimeout(this.dateChangeTimer);
  }

  this.dateChangeTimer = setTimeout(() => {
    this.applyFilters();
  }, 500);
}

  async applyFilters() {
    this.viewModel.pagination.PageNo = 1;
    await this.loadOrders();
  }

  async clearFilters() {
    this.viewModel.filters = {};
    this.viewModel.pagination.PageNo = 1;
    await this.loadOrders();
  }

  // Open date picker when calendar icon is clicked
  openDatePicker(inputId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      if (input.showPicker) {
        input.showPicker();
      } else {
        input.click();
      }
      input.focus();
    }
  }

  async updateStatus(order: OrderSM, newStatus: string) {
    try {
      this._commonService.presentLoading();
      
      const response = await this.orderService.updateOrderStatus(order.id, newStatus);
      
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
        order.status = saved;
        await this.loadOrders();
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

  getStatusBadgeClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'paid' || statusLower === 'delivered') return 'bg-success';
    if (statusLower === 'shipped' || statusLower === 'processing') return 'bg-warning text-dark';
    if (statusLower === 'failed' || statusLower === 'cancelled') return 'bg-danger';
    if (statusLower === 'created' || statusLower === 'payment_pending') return 'bg-info';
    if (statusLower === 'resolved') return 'bg-primary';
    return 'bg-secondary';
  }

  getPaymentStatus(order: OrderSM): 'UNPAID' | 'PAID' | 'REFUNDED' {
    const ps = (order.paymentStatus || order.payment_status || '').toUpperCase();
    if (ps === 'PAID' || ps === 'REFUNDED' || ps === 'UNPAID') return ps as any;
    const s = (order.status || '').toLowerCase();
    if (s === 'paid' || s === 'delivered' || s === 'shipped') return 'PAID';
    if (s === 'refunded' || s === 'partially_refunded') return 'REFUNDED';
    return 'UNPAID';
  }

  getPaymentBadgeClass(order: OrderSM): string {
    const ps = this.getPaymentStatus(order);
    if (ps === 'PAID') return 'bg-success';
    if (ps === 'REFUNDED') return 'bg-warning text-dark';
    return 'bg-danger';
  }

  getPaymentStatusLabel(order: OrderSM): string {
    const ps = this.getPaymentStatus(order);
    if (ps === 'PAID') return 'Paid';
    if (ps === 'REFUNDED') return 'Refunded';
    return 'Unpaid';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  exportToPDF() {
    const columns = [
      { header: 'Order ID', dataKey: 'id' },
      { header: 'Razorpay Order ID', dataKey: 'razorpayOrderId' },
      { header: 'Customer', dataKey: 'customerName' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Date', dataKey: 'createdOnUTC' }
    ];

    const data = this.viewModel.orders.map(order => ({
      id: order.id,
      razorpayOrderId: order.razorpayOrderId || 'N/A',
      customerName: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || order.customer?.email || 'N/A',
      amount: this.formatCurrency(order.amount),
      status: order.status || 'N/A',
      createdOnUTC: this.formatDate(order.createdOnUTC)
    }));

    this.exportService.exportToPDF(data, columns, 'Orders Report', 'orders');
  }

  exportToExcel() {
    const columns = [
      { header: 'Order ID', dataKey: 'id' },
      { header: 'Razorpay Order ID', dataKey: 'razorpayOrderId' },
      { header: 'Customer Name', dataKey: 'customer.firstName' },
      { header: 'Customer Email', dataKey: 'customer.email' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Date', dataKey: 'createdOnUTC' }
    ];

    const data = this.viewModel.orders.map(order => ({
      ...order,
      amount: order.amount || 0,
      createdOnUTC: order.createdOnUTC ? new Date(order.createdOnUTC).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'
    }));

    this.exportService.exportToExcel(data, columns, 'orders');
  }
}

