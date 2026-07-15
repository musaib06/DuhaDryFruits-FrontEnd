import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AdminNotificationService, SendPushRequest, PushAudience } from '../../services/admin-notification.service';
import { ProductService } from '../../../../services/product.service';
import { ProductNameIdSM } from '../../../../models/service-models/app/v1/product-name-id-s-m';
import { CustomerService } from '../../../../services/customer.service';
import { CustomerViewModel } from '../../../../models/view/Admin/customer.viewmodel';
import { CustomerDetailSM } from '../../../../models/service-models/app/v1/customer-detail-s-m';

interface SelectedCustomer {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-send-notification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './send-notification.component.html',
  styleUrls: ['./send-notification.component.css']
})
export class SendNotificationComponent implements OnInit {
  form: FormGroup;
  isSending = false;
  products: ProductNameIdSM[] = [];
  result: { type: 'success' | 'error'; text: string } | null = null;

  // Audience targeting
  audience: PushAudience = 'all';

  // Customer picker (only used when audience === 'selected')
  customerSearch = '';
  customerResults: CustomerDetailSM[] = [];
  selectedCustomers: SelectedCustomer[] = [];
  isSearchingCustomers = false;
  private searchTimeout: any;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminNotificationService,
    private productService: ProductService,
    private customerService: CustomerService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      message: ['', [Validators.required, Validators.maxLength(500)]],
      productId: [null],
      url: [''],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  private async loadProducts(): Promise<void> {
    try {
      const response = await this.productService.getAllProductNamesOnly();
      if (!response.isError && response.successData) {
        this.products = response.successData;
      }
    } catch (error) {
      console.error('Failed to load products for notification form:', error);
    }
  }

  setAudience(value: PushAudience): void {
    this.audience = value;
    this.onAudienceChange();
  }

  /**
   * Reset the customer picker whenever the audience moves away from
   * "selected". Bound to the radio group's ngModelChange.
   */
  onAudienceChange(): void {
    if (this.audience !== 'selected') {
      this.customerResults = [];
      this.customerSearch = '';
    }
  }

  onCustomerSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    const term = this.customerSearch?.trim();
    if (!term) {
      this.customerResults = [];
      this.isSearchingCustomers = false;
      return;
    }
    this.isSearchingCustomers = true;
    this.searchTimeout = setTimeout(() => this.searchCustomers(term), 350);
  }

  private async searchCustomers(term: string): Promise<void> {
    try {
      const vm = new CustomerViewModel();
      vm.pagination.PageNo = 1;
      vm.pagination.PageSize = 10;
      vm.filters = { search: term };

      const response = await this.customerService.getAllPaginatedCustomer(vm);
      if (!response.isError && response.successData) {
        const data = response.successData as any;
        const list: CustomerDetailSM[] = Array.isArray(data) ? data : (data.data || []);
        // Hide customers already selected.
        const selectedIds = new Set(this.selectedCustomers.map((c) => c.id));
        this.customerResults = list.filter((c) => c.id != null && !selectedIds.has(c.id as number));
      } else {
        this.customerResults = [];
      }
    } catch (error) {
      console.error('Customer search failed:', error);
      this.customerResults = [];
    } finally {
      this.isSearchingCustomers = false;
    }
  }

  addCustomer(customer: CustomerDetailSM): void {
    if (customer.id == null) return;
    const id = customer.id as number;
    if (this.selectedCustomers.some((c) => c.id === id)) return;
    const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || `#${id}`;
    this.selectedCustomers.push({ id, name, email: customer.email });
    this.customerResults = this.customerResults.filter((c) => c.id !== id);
  }

  removeCustomer(id: number): void {
    this.selectedCustomers = this.selectedCustomers.filter((c) => c.id !== id);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.result = { type: 'error', text: 'Please enter both a title and a message.' };
      return;
    }

    if (this.audience === 'selected' && this.selectedCustomers.length === 0) {
      this.result = { type: 'error', text: 'Please select at least one customer, or change the audience.' };
      return;
    }

    this.isSending = true;
    this.result = null;

    const value = this.form.value;
    const request: SendPushRequest = {
      title: value.title?.trim(),
      message: value.message?.trim(),
      productId: value.productId ? Number(value.productId) : null,
      url: value.url?.trim() || null,
      imageUrl: value.imageUrl?.trim() || null,
      audience: this.audience,
      customerIds: this.audience === 'selected' ? this.selectedCustomers.map((c) => c.id) : null
    };

    this.adminService.sendPush(request).subscribe({
      next: (response) => {
        this.isSending = false;
        if (response.success) {
          this.result = {
            type: 'success',
            text: response.message || 'Notification sent successfully.'
          };
          this.form.reset({ title: '', message: '', productId: null, url: '', imageUrl: '' });
          this.selectedCustomers = [];
          this.customerSearch = '';
          this.customerResults = [];
          this.audience = 'all';
        } else {
          this.result = { type: 'error', text: response.error || 'Failed to send notification.' };
        }
      },
      error: (error) => {
        this.isSending = false;
        this.result = {
          type: 'error',
          text: error?.error?.error || 'Failed to send notification. Please try again.'
        };
      }
    });
  }

  get title() { return this.form.get('title'); }
  get message() { return this.form.get('message'); }
}
