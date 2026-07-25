import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseComponent } from '../../../../../base.component';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { OrderService } from '../../../../../services/order.service';
import { OrderSM } from '../../../../../models/service-models/app/v1/order-s-m';
import { MyOrdersViewModel } from '../../../../../models/view/end-user/my-orders.viewmodel';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductUtils } from '../../../../../utils/product.utils';
import { resolveProductImage } from '../../../../../utils/image-url.util';

// Type declaration for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

type OrderStatus = 'Processing' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled' | 'created' | 'paid' | 'failed' | 'flagged' | 'refunded' | 'partially_refunded' | 'cancelled';

@Component({
  selector: 'app-orders',
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
  standalone: true
})
export class MyOrders extends BaseComponent<MyOrdersViewModel> implements OnInit {
  protected _logHandler: LogHandlerService;
  
  isLoading = false;
  hasSearched = false; // Track if user has searched for orders

  // UI state
  searchTerm = '';
  statusFilter: '' | OrderStatus = '';
  sortBy: 'dateDesc' | 'dateAsc' | 'totalDesc' | 'totalAsc' = 'dateDesc';

  // pagination
  page = 1;
  pageSize = 5;

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private orderService: OrderService
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = new MyOrdersViewModel();
    this.viewModel.pagination.PageSize = this.pageSize;
  }

  formatVariantSizeAndWeight(it: any): string {
    const v = it?.variant;
    const d = it?.variantDetails;
    return ProductUtils.getDisplayUnit({ ...d, ...v }) || 'N/A';
  }

  formatVariantUnit(it: any): string {
    const v = it?.variant;
    const d = it?.variantDetails;
    const unit = (v?.unitSymbol ?? d?.unitSymbol ?? v?.unitName ?? d?.unitName ?? '').toString();
    return unit || 'N/A';
  }

  formatVariantWeight(it: any): string {
    const v = it?.variant;
    const d = it?.variantDetails;
    return ProductUtils.getDisplayUnit({ ...d, ...v }) || 'N/A';
  }

  async ngOnInit(): Promise<void> {
    // Don't load orders automatically - wait for user to enter email
  }

  async loadOrders() {
    if (!this.viewModel.customerEmail || !this.viewModel.customerEmail.trim()) {
      this._commonService.showSweetAlertToast({
        title: 'Email Required',
        text: 'Please enter your email address to view orders',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.viewModel.customerEmail.trim())) {
      this._commonService.showSweetAlertToast({
        title: 'Invalid Email',
        text: 'Please enter a valid email address',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Mark that user has searched
    this.hasSearched = true;

    try {
      this.isLoading = true;
      this.viewModel.loading = true;
      this._commonService.presentLoading();

      // Update viewModel filters - map UI status to backend status
      this.viewModel.filters.status = this.mapStatusToBackend(this.statusFilter);
      this.viewModel.filters.customerEmail = this.viewModel.customerEmail.trim();
      
      // Fetch ALL orders (no pagination limit) to enable client-side pagination
      this.viewModel.pagination.PageNo = 1;
      this.viewModel.pagination.PageSize = 10000; // Large number to get all orders

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
        this.viewModel.orders = [];
        this.viewModel.totalCount = 0;
      } else {
        // Handle both old format (array) and new format (object with data and total)
        let orderSMs: OrderSM[] = [];
        let totalCount = 0;
        
        const responseData = response.successData as any;
        
        if (Array.isArray(responseData)) {
          // Old format - just array
          orderSMs = responseData;
          totalCount = orderSMs.length;
        } else if (responseData && typeof responseData === 'object' && responseData.data) {
          // New format - object with data and total
          orderSMs = Array.isArray(responseData.data) ? responseData.data : [];
          totalCount = responseData.total || orderSMs.length;
        } else {
          orderSMs = [];
          totalCount = 0;
        }
        
        this.viewModel.orders = orderSMs;
        this.viewModel.totalCount = totalCount;
        this.viewModel.pagination.totalCount = totalCount;
        this.viewModel.pagination.totalPages = Array.from(
          { length: Math.ceil(totalCount / this.viewModel.pagination.PageSize) },
          (_, i) => i + 1
        );
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
      this.viewModel.orders = [];
      this.viewModel.totalCount = 0;
    } finally {
      this.isLoading = false;
      this.viewModel.loading = false;
      this._commonService.dismissLoader();
    }
  }

  /**
   * Check if order should show invoice (not failed or created-only)
   */
  shouldShowInvoice(order: OrderSM): boolean {
    const status = (order.status || '').toLowerCase();
    return status !== 'failed' && status !== 'created';
  }

  /**
   * Map backend status to UI status
   */
  mapStatusToUI(status: string): OrderStatus {
    const statusLower = status.toLowerCase();
    // Keep "paid" explicit so customer does not see delivered too early
    if (statusLower === 'paid') return 'Paid';
    // Delivered status
    if (statusLower === 'delivered') return 'Delivered';
    // Shipped status
    if (statusLower === 'shipped') return 'Shipped';
    // Processing statuses (created, payment_pending, etc.)
    if (statusLower === 'created' || statusLower === 'processing' || statusLower === 'payment_pending') return 'Processing';
    // Cancelled statuses
    if (statusLower === 'cancelled' || statusLower === 'failed' || statusLower === 'flagged') return 'Cancelled';
    // Default to Processing
    return 'Processing';
  }

  /**
   * Map UI status to backend status for filtering
   */
  mapStatusToBackend(uiStatus: '' | OrderStatus): string | undefined {
    if (!uiStatus) return undefined;
    const statusLower = uiStatus.toLowerCase();
    if (statusLower === 'processing') return 'created';
    if (statusLower === 'paid') return 'paid';
    if (statusLower === 'shipped') return 'shipped';
    if (statusLower === 'delivered') return 'delivered';
    if (statusLower === 'cancelled') return 'cancelled';
    return undefined;
  }

  /* -------------- computed lists ---------------- */
  get filteredOrders(): OrderSM[] {
    let arr = [...this.viewModel.orders];
    if (this.searchTerm && this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      arr = arr.filter(o =>
        String(o.id).toLowerCase().includes(q) ||
        o.razorpayOrderId?.toLowerCase().includes(q) ||
        o.items?.some(it => 
          it.product?.name?.toLowerCase().includes(q) ||
          it.variant?.sku?.toLowerCase().includes(q)
        )
      );
    }
    if (this.statusFilter) {
      arr = arr.filter(o => this.mapStatusToUI(o.status || 'created') === this.statusFilter);
    }
    switch (this.sortBy) {
      case 'dateAsc': arr.sort((a,b) => {
        const dateA = a.createdOnUTC ? new Date(a.createdOnUTC).getTime() : 0;
        const dateB = b.createdOnUTC ? new Date(b.createdOnUTC).getTime() : 0;
        return dateA - dateB;
      }); break;
      case 'dateDesc': arr.sort((a,b) => {
        const dateA = a.createdOnUTC ? new Date(a.createdOnUTC).getTime() : 0;
        const dateB = b.createdOnUTC ? new Date(b.createdOnUTC).getTime() : 0;
        return dateB - dateA;
      }); break;
      case 'totalAsc': arr.sort((a,b) => (a.amount || 0) - (b.amount || 0)); break;
      case 'totalDesc': arr.sort((a,b) => (b.amount || 0) - (a.amount || 0)); break;
    }
    return arr;
  }

  get pagedOrders(): OrderSM[] {
    // Client-side pagination on filtered results
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredOrders.slice(start, end);
  }

  get totalPages(): number {
    // Use filtered orders count for pagination (client-side)
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize));
  }

  get totalCount(): number {
    return this.viewModel.pagination.totalCount;
  }

  /* --------------- actions ------------------ */
  setFilter(status: '' | OrderStatus) {
    this.statusFilter = status;
    this.page = 1; // Reset to first page when filter changes
    // No need to reload orders - client-side filtering
  }

  private orderDetailsMap = new Map<number, boolean>();

  toggleDetails(order: OrderSM) {
    if (!order.id) return;
    const current = this.orderDetailsMap.get(order.id) || false;
    this.orderDetailsMap.set(order.id, !current);
  }

  isDetailsShown(order: OrderSM): boolean {
    if (!order.id) return false;
    return this.orderDetailsMap.get(order.id) || false;
  }

  statusClass(status: string): string {
    return this.mapStatusToUI(status);
  }

  getPaymentStatus(order: any): 'UNPAID' | 'PAID' | 'REFUNDED' {
    const ps = (order?.paymentStatus || order?.payment_status || '').toString().toUpperCase();
    if (ps === 'PAID' || ps === 'REFUNDED' || ps === 'UNPAID') return ps as any;
    const s = (order?.status || '').toLowerCase();
    if (s === 'paid' || s === 'delivered' || s === 'shipped') return 'PAID';
    if (s === 'refunded' || s === 'partially_refunded') return 'REFUNDED';
    return 'UNPAID';
  }

  getPaymentStatusLabel(order: any): string {
    const ps = this.getPaymentStatus(order);
    if (ps === 'PAID') return 'Paid';
    if (ps === 'REFUNDED') return 'Refunded';
    return 'Unpaid';
  }

  onSelectionChange() {
    // keep for future: bulk operations
  }

  async prevPage() {
    if (this.page > 1) {
      this.page--;
      this.viewModel.pagination.PageNo = this.page;
      await this.loadOrders();
    }
  }

  async nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.viewModel.pagination.PageNo = this.page;
      await this.loadOrders();
    }
  }

  async onSearch() {
    this.page = 1;
    this.viewModel.pagination.PageNo = 1;
    // Search is done client-side on filteredOrders
  }

  async onSubmitEmail() {
    this.page = 1;
    this.viewModel.pagination.PageNo = 1;
    await this.loadOrders();
  }

  /**
   * Download all orders as PDF for the customer
   */
  async downloadAllOrdersPDF() {
    if (!this.viewModel.customerEmail || !this.viewModel.customerEmail.trim()) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Email is required to download orders',
        icon: 'error'
      });
      return;
    }

    try {
      this._commonService.presentLoading();
      
      // Fetch ALL orders for the customer (no pagination)
      const tempViewModel = new MyOrdersViewModel();
      tempViewModel.customerEmail = this.viewModel.customerEmail.trim();
      tempViewModel.filters.customerEmail = tempViewModel.customerEmail;
      tempViewModel.pagination.PageNo = 1;
      tempViewModel.pagination.PageSize = 10000; // Large number to get all orders
      
      const response = await this.orderService.getAllOrders(tempViewModel);
      
      if (response.isError) {
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: response.errorData?.displayMessage || 'Failed to fetch orders',
          icon: 'error'
        });
        return;
      }

      // Get all orders
      let allOrders: OrderSM[] = [];
      const responseData = response.successData as any;
      
      if (Array.isArray(responseData)) {
        allOrders = responseData;
      } else if (responseData && typeof responseData === 'object' && responseData.data) {
        allOrders = Array.isArray(responseData.data) ? responseData.data : [];
      }

      if (allOrders.length === 0) {
        this._commonService.showSweetAlertToast({
          title: 'No Orders',
          text: 'No orders found to download',
          icon: 'info'
        });
        return;
      }

      // Generate PDF with all orders
      console.log('Generating PDF for', allOrders.length, 'orders');
      this.generateOrdersPDF(allOrders);
      
    } catch (error: any) {
      console.error('Error downloading all orders PDF:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: `Failed to download orders PDF: ${error.message || 'Unknown error'}`,
        icon: 'error'
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  /**
   * Download single order invoice as PDF
   */
  downloadInvoice(order: OrderSM) {
    if (!order.id) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Invalid order data',
        icon: 'error'
      });
      return;
    }

    try {
      console.log('Generating invoice PDF for order:', order.id);
      const doc = new jsPDF();
      
      // Company/Store Header
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('Duha Dryfruits', 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Invoice', 14, 30);
      
      // Invoice Details
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      let yPos = 45;
      
      doc.text(`Invoice #: INV-${order.id}`, 14, yPos);
      yPos += 7;
      doc.text(`Order #: ${order.razorpayOrderId || String(order.id)}`, 14, yPos);
      yPos += 7;
      doc.text(`Date: ${this.formatDate(order.createdOnUTC)}`, 14, yPos);
      yPos += 7;
      
      if (order.customer) {
        doc.text(`Customer: ${order.customer.firstName} ${order.customer.lastName}`, 14, yPos);
        yPos += 7;
        if (order.customer.email) {
          doc.text(`Email: ${order.customer.email}`, 14, yPos);
          yPos += 7;
        }
        if (order.customer.contact) {
          doc.text(`Contact: ${order.customer.contact}`, 14, yPos);
          yPos += 7;
        }
      }
      
      yPos += 5;
      
      // Order Items Table
      const tableData: any[] = [];
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          const productName = item.product?.name || 'Unknown Product';
          const variantInfo = item.variant?.unitSymbol || item.variant?.unitName
            ? `${item.variant?.unitSymbol || item.variant?.unitName}`
            : item.variant?.sku 
              ? item.variant.sku
              : item.variantDetails?.unitSymbol || item.variantDetails?.unitName
                ? `${item.variantDetails?.unitSymbol || item.variantDetails?.unitName}`
                : 'N/A';
          
          // Ensure numeric values
          const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0)) || 0;
          const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity || 1)) || 1;
          const total = typeof item.total === 'number' ? item.total : (price * quantity);
          
          tableData.push([
            index + 1,
            productName,
            variantInfo,
            quantity,
            `₹${price.toFixed(2)}`,
            `₹${total.toFixed(2)}`
          ]);
        });
      }
      
      // Only create table if there are items
      if (tableData.length > 0) {
        try {
          autoTable(doc, {
            head: [['#', 'Product', 'Variant', 'Qty', 'Price', 'Total']],
            body: tableData,
            startY: yPos,
            styles: { 
              fontSize: 9, 
              cellPadding: 3,
              textColor: [0, 0, 0]
            },
            headStyles: { 
              fillColor: [78, 115, 223], 
              textColor: [255, 255, 255], 
              fontStyle: 'bold' 
            },
            alternateRowStyles: { 
              fillColor: [245, 245, 245] 
            },
            margin: { top: yPos }
          });
        } catch (tableError: any) {
          console.error('Error creating table:', tableError);
          // Fallback: add items as text if table fails
          doc.text('Order Items:', 14, yPos);
          yPos += 7;
          order.items?.forEach((item, idx) => {
            const productName = item.product?.name || 'Unknown Product';
            const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0)) || 0;
            const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity || 1)) || 1;
            doc.text(`${idx + 1}. ${productName} - Qty: ${quantity} - Price: ₹${price.toFixed(2)}`, 14, yPos);
            yPos += 7;
          });
        }
      } else {
        doc.text('No items in this order', 14, yPos);
        yPos += 7;
      }
      
      // Get final Y position after table
      let finalY = yPos + 20; // Default if table wasn't created
      if (tableData.length > 0 && (doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) {
        finalY = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Totals Section
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      let totalY = finalY;
      doc.text('Subtotal:', 150, totalY, { align: 'right' });
      doc.text(this.formatCurrency(order.amount), 190, totalY);
      totalY += 7;
      
      if (order.paid_amount) {
        doc.text('Paid:', 150, totalY, { align: 'right' });
        doc.text(this.formatCurrency(order.paid_amount), 190, totalY);
        totalY += 7;
      }
      
      if (order.due_amount && order.due_amount > 0) {
        doc.text('Due:', 150, totalY, { align: 'right' });
        doc.text(this.formatCurrency(order.due_amount), 190, totalY);
        totalY += 7;
      }
      
      // Total
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', 150, totalY, { align: 'right' });
      doc.text(this.formatCurrency(order.amount), 190, totalY);
      
      // Payment Status
      totalY += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${this.mapStatusToUI(order.status || 'created')}`, 14, totalY);
      
      if (order.paymentId) {
        totalY += 7;
        doc.text(`Payment ID: ${order.paymentId}`, 14, totalY);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Thank you for your business!', 14, pageHeight - 20, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 14, pageHeight - 15, { align: 'center' });
      
      // Save PDF
      const fileName = `Invoice_${order.id}_${order.razorpayOrderId || 'ORD'}_${new Date().getTime()}.pdf`;
      console.log('Saving PDF with filename:', fileName);
      doc.save(fileName);
      
      console.log('PDF saved successfully');
      this._commonService.showSweetAlertToast({
        title: 'Success',
        text: 'Invoice downloaded successfully',
        icon: 'success'
      });
    } catch (error: any) {
      console.error('Error generating invoice PDF:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: `Failed to generate invoice PDF: ${error.message || 'Unknown error'}`,
        icon: 'error'
      });
    }
  }

  /**
   * Generate PDF with all orders for the customer
   */
  private generateOrdersPDF(orders: OrderSM[]) {
    try {
      console.log('generateOrdersPDF called with', orders.length, 'orders');
      const doc = new jsPDF();
      
      // Company/Store Header
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('Duha Dryfruits', 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('All Orders Report', 14, 30);
      
      // Customer Info
      if (orders.length > 0 && orders[0].customer) {
        const customer = orders[0].customer;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Customer: ${customer.firstName} ${customer.lastName}`, 14, 40);
        if (customer.email) {
          doc.text(`Email: ${customer.email}`, 14, 47);
        }
      }
      
      doc.setFontSize(10);
      doc.text(`Total Orders: ${orders.length}`, 14, 54);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 14, 61);
      
      let startY = 70;
      
      // Generate invoice for each order
      orders.forEach((order, index) => {
        // Add new page for each order (except first)
        if (index > 0) {
          doc.addPage();
          startY = 20;
        }
        
        // Order Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Order #${order.id}`, 14, startY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        startY += 7;
        doc.text(`Date: ${this.formatDate(order.createdOnUTC)}`, 14, startY);
        startY += 7;
        if (order.razorpayOrderId) {
          doc.text(`Order ID: ${order.razorpayOrderId}`, 14, startY);
          startY += 7;
        }
        doc.text(`Status: ${this.mapStatusToUI(order.status || 'created')}`, 14, startY);
        startY += 10;
        
        // Order Items Table
        const tableData: any[] = [];
        if (order.items && order.items.length > 0) {
          order.items.forEach((item, itemIndex) => {
            const productName = item.product?.name || 'Unknown Product';
            const variantInfo = item.variant?.unitSymbol || item.variant?.unitName
              ? `${item.variant?.unitSymbol || item.variant?.unitName}`
              : item.variant?.sku 
                ? item.variant.sku
                : item.variantDetails?.unitSymbol || item.variantDetails?.unitName
                  ? `${item.variantDetails?.unitSymbol || item.variantDetails?.unitName}`
                  : 'N/A';
            
            // Ensure numeric values
            const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0)) || 0;
            const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity || 1)) || 1;
            const total = typeof item.total === 'number' ? item.total : (price * quantity);
            
            tableData.push([
              itemIndex + 1,
              productName,
              variantInfo,
              quantity,
              `₹${price.toFixed(2)}`,
              `₹${total.toFixed(2)}`
            ]);
          });
        }
        
        try {
          autoTable(doc, {
            head: [['#', 'Product', 'Variant', 'Qty', 'Price', 'Total']],
            body: tableData,
            startY: startY,
            styles: { 
              fontSize: 9, 
              cellPadding: 3,
              textColor: [0, 0, 0]
            },
            headStyles: { 
              fillColor: [78, 115, 223], 
              textColor: [255, 255, 255], 
              fontStyle: 'bold' 
            },
            alternateRowStyles: { 
              fillColor: [245, 245, 245] 
            },
            margin: { top: startY }
          });
        } catch (tableError: any) {
          console.error('Error creating table for order', order.id, ':', tableError);
          // Fallback: add items as text if table fails
          doc.text('Order Items:', 14, startY);
          startY += 7;
          order.items?.forEach((item, idx) => {
            const productName = item.product?.name || 'Unknown Product';
            const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0)) || 0;
            const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity || 1)) || 1;
            doc.text(`${idx + 1}. ${productName} - Qty: ${quantity} - Price: ₹${price.toFixed(2)}`, 14, startY);
            startY += 7;
          });
        }
        
        // Get final Y position after table
        let finalY = startY + 20; // Default if table wasn't created
        if (tableData.length > 0 && (doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) {
          finalY = (doc as any).lastAutoTable.finalY + 10;
        }
        
        // Totals
        doc.setFontSize(10);
        let totalY = finalY;
        doc.text('Subtotal:', 150, totalY, { align: 'right' });
        doc.text(this.formatCurrency(order.amount), 190, totalY);
        totalY += 7;
        
        if (order.paid_amount) {
          doc.text('Paid:', 150, totalY, { align: 'right' });
          doc.text(this.formatCurrency(order.paid_amount), 190, totalY);
          totalY += 7;
        }
        
        if (order.due_amount && order.due_amount > 0) {
          doc.text('Due:', 150, totalY, { align: 'right' });
          doc.text(this.formatCurrency(order.due_amount), 190, totalY);
          totalY += 7;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', 150, totalY, { align: 'right' });
        doc.text(this.formatCurrency(order.amount), 190, totalY);
      });
      
      // Footer on last page
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Thank you for your business!', 14, pageHeight - 20, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 14, pageHeight - 15, { align: 'center' });
      
      // Save PDF
      const fileName = `All_Orders_${this.viewModel.customerEmail.replace('@', '_at_')}_${new Date().getTime()}.pdf`;
      console.log('Saving PDF with filename:', fileName);
      doc.save(fileName);
      
      console.log('PDF saved successfully');
      this._commonService.showSweetAlertToast({
        title: 'Success',
        text: `Downloaded ${orders.length} orders as PDF`,
        icon: 'success'
      });
    } catch (error: any) {
      console.error('Error generating orders PDF:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: `Failed to generate orders PDF: ${error.message || 'Unknown error'}`,
        icon: 'error'
      });
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
  }

  getProductImage(product: any): string {
    return resolveProductImage(product, 'assets/logo.png');
  }
}
