import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../../base.component';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { InvoiceService } from '../../../../../../services/invoice.service';
import { CustomerService } from '../../../../../../services/customer.service';
import { ExportService } from '../../../../../../services/export.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaginationComponent } from '../../../../internal/pagination/pagination.component';
import { InvoiceViewModel } from '../../../../../../models/view/Admin/invoice.viewmodel';
import { InvoiceSM } from '../../../../../../models/service-models/app/v1/invoice-s-m';
import { CustomerDetailSM } from '../../../../../../models/service-models/app/v1/customer-detail-s-m';

@Component({
  selector: 'app-invoice-list',
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
  standalone: true
})
export class InvoiceListComponent extends BaseComponent<InvoiceViewModel> implements OnInit {
  protected _logHandler: LogHandlerService;

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    private exportService: ExportService
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = new InvoiceViewModel();
    this.viewModel.pagination.PageSize = 20;
  }

  async ngOnInit() {
    await this.loadCustomers();
    await this.loadInvoices();
  }

  async loadCustomers() {
    try {
      const response = await this.customerService.getAllPaginatedCustomer({ 
        pagination: { PageNo: 1, PageSize: 1000, totalCount: 0, totalPages: [] },
        customers: []
      } as any);
      if (!response.isError && response.successData) {
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

  async loadInvoices() {
    try {
      this.viewModel.loading = true;
      this._commonService.presentLoading();
      
      const response = await this.invoiceService.getAllInvoices(this.viewModel);
      
      if (response.isError) {
        this.viewModel.error = response.errorData?.displayMessage || 'Failed to load invoices';
        await this._logHandler.logObject(response.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: this.viewModel.error,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        // Backend returns array of invoices
        const invoices = Array.isArray(response.successData) ? response.successData : [];
        this.viewModel.invoices = invoices;
        this.viewModel.totalCount = invoices.length;
        this.viewModel.pagination.totalCount = this.viewModel.totalCount;
        this.viewModel.pagination.totalPages = Array.from({ length: Math.ceil(this.viewModel.totalCount / this.viewModel.pagination.PageSize) }, (_, i) => i + 1);
        
        if (invoices.length > 0) {
          console.log('Invoices loaded successfully:', invoices.length, 'invoices');
        } else {
          console.log('No invoices found');
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
    await this.loadInvoices();
  }

  async applyFilters() {
    this.viewModel.pagination.PageNo = 1;
    await this.loadInvoices();
  }

  async clearFilters() {
    this.viewModel.filters = {};
    this.viewModel.pagination.PageNo = 1;
    await this.loadInvoices();
  }

  getStatusBadgeClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'paid' || statusLower === 'delivered') return 'bg-success';
    if (statusLower === 'shipped' || statusLower === 'processing') return 'bg-warning text-dark';
    if (statusLower === 'failed' || statusLower === 'cancelled') return 'bg-danger';
    return 'bg-secondary';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
  }

  formatCurrency(amount: string | number | undefined): string {
    if (!amount) return '₹0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN')}`;
  }

  exportToPDF() {
    const columns = [
      { header: 'Invoice #', dataKey: 'invoiceNumber' },
      { header: 'Order #', dataKey: 'orderNumber' },
      { header: 'Date', dataKey: 'invoiceDate' },
      { header: 'Customer', dataKey: 'customerName' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Status', dataKey: 'status' }
    ];

    const data = this.viewModel.invoices.map(invoice => ({
      invoiceNumber: invoice.invoiceNumber || 'N/A',
      orderNumber: invoice.orderNumber || 'N/A',
      invoiceDate: this.formatDate(invoice.invoiceDate),
      customerName: invoice.customerName || 'N/A',
      amount: this.formatCurrency(invoice.amount),
      status: invoice.status || 'N/A'
    }));

    this.exportService.exportToPDF(data, columns, 'Invoices Report', 'invoices');
  }

  exportToExcel() {
    const columns = [
      { header: 'Invoice #', dataKey: 'invoiceNumber' },
      { header: 'Order #', dataKey: 'orderNumber' },
      { header: 'Date', dataKey: 'invoiceDate' },
      { header: 'Customer Name', dataKey: 'customerName' },
      { header: 'Customer Email', dataKey: 'customerEmail' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Status', dataKey: 'status' }
    ];

    const data = this.viewModel.invoices.map(invoice => ({
      invoiceNumber: invoice.invoiceNumber || 'N/A',
      orderNumber: invoice.orderNumber || 'N/A',
      invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A',
      customerName: invoice.customerName || 'N/A',
      customerEmail: invoice.customerEmail || 'N/A',
      amount: invoice.amount || 0,
      status: invoice.status || 'N/A'
    }));

    this.exportService.exportToExcel(data, columns, 'invoices');
  }
}

