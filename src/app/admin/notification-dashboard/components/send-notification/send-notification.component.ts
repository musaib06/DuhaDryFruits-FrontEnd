import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AdminNotificationService, SendPushRequest, PushAudience } from '../../services/admin-notification.service';
import { ProductService } from '../../../../services/product.service';
import { ProductNameIdSM } from '../../../../models/service-models/app/v1/product-name-id-s-m';
import { CustomerService } from '../../../../services/customer.service';
import { CustomerViewModel } from '../../../../models/view/Admin/customer.viewmodel';
import { CustomerDetailSM } from '../../../../models/service-models/app/v1/customer-detail-s-m';
import { CommonService } from '../../../../services/common.service';

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
  result: { type: 'success' | 'error' | 'warning'; text: string } | null = null;

  audience: PushAudience = 'all';

  customerSearch = '';
  allCustomers: CustomerDetailSM[] = [];
  customersLoading = false;
  selectedCustomers: SelectedCustomer[] = [];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminNotificationService,
    private productService: ProductService,
    private customerService: CustomerService,
    private commonService: CommonService
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
    void this.loadProducts();
    void this.loadAllCustomers();
  }

  private async loadProducts(): Promise<void> {
    try {
      const response = await this.productService.getAllProductNamesOnly();
      if (!response.isError && response.successData) {
        this.products = response.successData;
      }
    } catch (error) {
      console.error('[SendNotification] Failed to load products:', error);
    }
  }

  /** Load the full customer list once; filter client-side in the picker. */
  private async loadAllCustomers(): Promise<void> {
    this.customersLoading = true;
    try {
      const vm = new CustomerViewModel();
      vm.pagination.PageNo = 1;
      vm.pagination.PageSize = 5000;
      const response = await this.customerService.getAllPaginatedCustomer(vm);
      if (!response.isError && response.successData) {
        const data = response.successData as any;
        this.allCustomers = Array.isArray(data) ? data : (data.data || []);
      } else {
        this.allCustomers = [];
      }
    } catch (error) {
      console.error('[SendNotification] Failed to load customers:', error);
      this.allCustomers = [];
    } finally {
      this.customersLoading = false;
    }
  }

  get filteredCustomers(): CustomerDetailSM[] {
    const selectedIds = new Set(this.selectedCustomers.map((c) => c.id));
    const term = this.customerSearch.trim().toLowerCase();
    return this.allCustomers.filter((c) => {
      if (c.id == null || selectedIds.has(c.id as number)) return false;
      if (!term) return true;
      const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.contact || '').toLowerCase();
      return name.includes(term) || email.includes(term) || phone.includes(term);
    });
  }

  setAudience(value: PushAudience): void {
    this.audience = value;
    this.onAudienceChange();
  }

  onAudienceChange(): void {
    if (this.audience !== 'selected') {
      this.customerSearch = '';
    }
  }

  addCustomer(customer: CustomerDetailSM): void {
    if (customer.id == null) return;
    const id = customer.id as number;
    if (this.selectedCustomers.some((c) => c.id === id)) return;
    const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || `#${id}`;
    this.selectedCustomers.push({ id, name, email: customer.email });
  }

  removeCustomer(id: number): void {
    this.selectedCustomers = this.selectedCustomers.filter((c) => c.id !== id);
  }

  selectAllShownCustomers(): void {
    for (const customer of this.filteredCustomers) {
      this.addCustomer(customer);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.result = { type: 'error', text: 'Please enter both a title and a message.' };
      void this.showAlert('Validation error', this.result.text, 'error');
      return;
    }

    if (this.audience === 'selected' && this.selectedCustomers.length === 0) {
      this.result = { type: 'error', text: 'Please select at least one customer, or change the audience.' };
      void this.showAlert('Audience required', this.result.text, 'error');
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

    console.log('[SendNotification] Sending push:', request);

    this.adminService.sendPush(request).subscribe({
      next: (response) => {
        this.isSending = false;
        console.log('[SendNotification] Response:', response);

        if (response.success) {
          const total = response.data?.totalTokens ?? 0;
          const delivered = response.data?.successCount ?? 0;

          if (total === 0) {
            const warningText =
              'No devices are subscribed yet. Visitors must allow notifications in the browser first.';
            this.result = { type: 'warning', text: warningText };
            void this.showAlert('No subscribers', warningText, 'warning');
            return;
          }

          const successText = `Dispatched to ${total} device(s). ${delivered} delivered successfully.`;
          this.result = { type: 'success', text: successText };
          void this.showAlert('Notification sent', successText, 'success');

          this.form.reset({ title: '', message: '', productId: null, url: '', imageUrl: '' });
          this.selectedCustomers = [];
          this.customerSearch = '';
          this.audience = 'all';
        } else {
          const errorText = response.error || 'Failed to send notification.';
          this.result = { type: 'error', text: errorText };
          void this.showAlert('Send failed', errorText, 'error');
        }
      },
      error: (error) => {
        this.isSending = false;
        console.error('[SendNotification] HTTP error:', error);

        const status = error?.status;
        let errorText = 'Failed to send notification. Please try again.';

        if (status === 401 || status === 403) {
          errorText = 'Session expired or insufficient permissions. Please log in again as admin.';
        } else if (status === 0) {
          errorText = 'Network error or CORS issue. Check API connectivity and try again.';
        } else if (error?.error?.error) {
          errorText = `${error.error.error}${error.error.code ? ` (${error.error.code})` : ''}`;
        } else if (error?.error?.errors?.length) {
          errorText = error.error.errors.map((e: any) => e.msg).join(', ');
        }

        this.result = { type: 'error', text: errorText };
        void this.showAlert('Send failed', errorText, 'error');
      }
    });
  }

  private async showAlert(
    title: string,
    text: string,
    icon: 'success' | 'error' | 'warning' | 'info'
  ): Promise<void> {
    await this.commonService.showSweetAlert({
      title,
      text,
      icon,
      confirmButtonText: 'OK'
    });
  }

  get title() { return this.form.get('title'); }
  get message() { return this.form.get('message'); }
}
