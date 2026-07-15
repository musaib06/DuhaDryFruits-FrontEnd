import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../../../../../base.component';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { CustomerService } from '../../../../../../services/customer.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaginationComponent } from '../../../../internal/pagination/pagination.component';
import { CustomerViewModel } from '../../../../../../models/view/Admin/customer.viewmodel';
import { CustomerDetailSM } from '../../../../../../models/service-models/app/v1/customer-detail-s-m';

@Component({
  selector: 'app-customer-list',
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
  standalone: true
})
export class CustomerListComponent extends BaseComponent<CustomerViewModel> implements OnInit, OnDestroy {
  protected _logHandler: LogHandlerService;
  private searchTimeout: any;

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private customerService: CustomerService
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = new CustomerViewModel();
    this.viewModel.pagination.PageSize = 20;
  }

  ngOnInit() {
    this.loadCustomers();
  }

  async loadCustomers() {
    try {
      this.viewModel.loading = true;
      this._commonService.presentLoading();
      
      const response = await this.customerService.getAllPaginatedCustomer(this.viewModel as any);
      
      if (response.isError) {
        this.viewModel.error = response.errorData?.displayMessage || 'Failed to load customers';
        await this._logHandler.logObject(response.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: this.viewModel.error,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        // Handle both old format (array) and new format (object with data and total)
        let customers: CustomerDetailSM[] = [];
        let totalCount = 0;
        
        const responseData = response.successData as any;
        
        if (Array.isArray(responseData)) {
          // Old format - just array
          customers = responseData;
          totalCount = customers.length;
        } else if (responseData && typeof responseData === 'object' && responseData.data) {
          // New format - object with data and total
          customers = Array.isArray(responseData.data) ? responseData.data : [];
          totalCount = responseData.total || customers.length;
        } else {
          customers = [];
          totalCount = 0;
        }
        
        this.viewModel.customers = customers;
        this.viewModel.totalCount = totalCount;
        this.viewModel.pagination.totalCount = totalCount;
        this.viewModel.pagination.totalPages = Array.from({ length: Math.ceil(totalCount / this.viewModel.pagination.PageSize) }, (_, i) => i + 1);
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
    await this.loadCustomers();
  }

  async applyFilters() {
    // Debounce search to avoid too many API calls
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(async () => {
      this.viewModel.pagination.PageNo = 1;
      await this.loadCustomers();
    }, 300); // 300ms debounce
  }

  async clearFilters() {
    this.viewModel.filters = {};
    this.viewModel.pagination.PageNo = 1;
    await this.loadCustomers();
  }

  async deleteCustomer(customer: CustomerDetailSM) {
    const confirmed = await this._commonService.showSweetAlertConfirmation({
      title: 'Are you sure?',
      text: `Do you want to delete customer "${customer.firstName} ${customer.lastName}"?`,
      icon: 'warning',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });

    if (confirmed) {
      try {
        this._commonService.presentLoading();
        
        const response = await this.customerService.deleteCustomer(customer.id!);
        
        if (response.isError) {
          await this._logHandler.logObject(response.errorData);
          this._commonService.showSweetAlertToast({
            title: 'Error',
            text: response.errorData?.displayMessage || 'Failed to delete customer',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } else {
          this._commonService.showSweetAlertToast({
            title: 'Success',
            text: 'Customer deleted successfully',
            icon: 'success',
            confirmButtonText: 'OK'
          });
          await this.loadCustomers();
        }
      } catch (error: any) {
        await this._logHandler.logObject(error);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'An error occurred while deleting customer',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        this._commonService.dismissLoader();
      }
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getFullName(customer: CustomerDetailSM): string {
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Unknown';
  }

  getPrimaryAddress(customer: CustomerDetailSM): string {
    if (!customer.addresses || customer.addresses.length === 0) return 'No address';
    const address = customer.addresses[0];
    return `${address.addressLine1 || ''}${address.city ? ', ' + address.city : ''}${address.state ? ', ' + address.state : ''}${address.postalCode ? ' - ' + address.postalCode : ''}`.trim();
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}

