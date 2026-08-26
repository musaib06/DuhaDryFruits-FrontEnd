import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BaseComponent } from '../../../../../base.component';
import { BulkOrdersViewModel } from '../../../../../models/view/end-user/bulk-orders.viewmodel';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { ProductService } from '../../../../../services/product.service';
import { CategoryService } from '../../../../../services/category.service';
import { BulkCartService } from '../../../../../services/bulk-cart.service';
import { BulkOrderService } from '../../../../../services/bulk-order.service';
import { CustomerService } from '../../../../../services/customer.service';
import { PushNotificationService } from '../../../../../notification/services/push-notification.service';
import { AdminProductsViewModel } from '../../../../../models/view/Admin/admin-product.viewmodel';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { CategorySM } from '../../../../../models/service-models/app/v1/categories-s-m';
import { BulkCartItem } from '../../../../../models/service-models/app/v1/bulk-order-s-m';
import { ProductUtils } from '../../../../../utils/product.utils';
import { QueryFilter } from '../../../../../models/service-models/foundation/api-contracts/query-filter';
import { resolveProductImage } from '../../../../../utils/image-url.util';

@Component({
  selector: 'app-bulk-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bulk-orders.html',
  styleUrl: './bulk-orders.scss',
})
export class BulkOrders extends BaseComponent<BulkOrdersViewModel> implements OnInit, OnDestroy {
  readonly ProductUtils = ProductUtils;
  protected _logHandler: LogHandlerService;
  categories: CategorySM[] = [];
  private productVm = new AdminProductsViewModel();
  private search$ = new Subject<string>();
  private subs = new Subscription();

  readonly benefits = [
    { icon: 'ri-price-tag-3-line', title: 'Better Pricing', desc: 'Volume discounts for wholesale quantities' },
    { icon: 'ri-customer-service-2-line', title: 'Dedicated Support', desc: 'Personal account manager for your business' },
    { icon: 'ri-flashlight-line', title: 'Fast Processing', desc: 'Priority handling for bulk requests' },
    { icon: 'ri-building-4-line', title: 'Business Orders', desc: 'GST invoices and formal documentation' },
    { icon: 'ri-truck-line', title: 'Direct Shipment', desc: 'Nationwide delivery to your warehouse' },
    { icon: 'ri-archive-2-line', title: 'Custom Products', desc: 'Request products not in our catalog' },
  ];

  readonly processSteps = [
    { step: 1, title: 'Submit Request', desc: 'Select products and share your requirements' },
    { step: 2, title: 'Review & Quote', desc: 'Our team reviews and sends a custom quote' },
    { step: 3, title: 'Approval', desc: 'Confirm quantities, pricing and delivery timeline' },
    { step: 4, title: 'Payment', desc: 'Secure payment via Razorpay payment link' },
    { step: 5, title: 'Fulfillment', desc: 'Packed, shipped and tracked to your door' },
  ];

  readonly faqs = [
    { q: 'What is the minimum order quantity?', a: 'Minimum quantities vary by product. Each product shows its minimum bulk quantity on the selection page.' },
    { q: 'Do I need to pay upfront?', a: 'No payment is required when submitting a request. Payment is only requested after your order is approved.' },
    { q: 'Can I request products not listed?', a: 'Yes! Use the Custom Product Request form to describe products you need that are not in our catalog.' },
    { q: 'How long does approval take?', a: 'Most bulk requests are reviewed within 1-2 business days. Complex orders may take slightly longer.' },
    { q: 'Do you provide GST invoices?', a: 'Yes, we provide GST-compliant invoices for all approved business orders.' },
  ];

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private productService: ProductService,
    private categoryService: CategoryService,
    public bulkCart: BulkCartService,
    private bulkOrderService: BulkOrderService,
    private customerService: CustomerService,
    private pushNotificationService: PushNotificationService,
    private router: Router,
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = new BulkOrdersViewModel();
    this.viewModel.pagination.PageSize = 12;
  }

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.add('bulk-page-active');
    }
    this.loadCategories();
    this.loadProducts();
    this.subs.add(
      this.bulkCart.cartItems$.subscribe((items) => (this.viewModel.cartItems = items))
    );
    this.subs.add(
      this.bulkCart.customItems$.subscribe((items) => (this.viewModel.customItems = items))
    );
    this.subs.add(
      this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
        this.viewModel.pagination.PageNo = 1;
        this.loadProducts();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (typeof document !== 'undefined') {
      document.body.classList.remove('bulk-page-active');
    }
  }

  closeCustomIfBackdrop(event: Event): void {
    if (event.target === event.currentTarget) {
      this.viewModel.showCustomForm = false;
    }
  }

  closeCartIfBackdrop(event: Event): void {
    if (event.target === event.currentTarget) {
      this.viewModel.showCartPanel = false;
    }
  }

  onSearchChange(): void {
    this.search$.next(this.viewModel.searchTerm);
  }

  async loadCategories(): Promise<void> {
    try {
      const resp = await this.categoryService.getStorefrontCategories();
      if (!resp.isError) this.categories = resp.successData || [];
    } catch (e) {
      await this._logHandler.logObject(e);
    }
  }

  async loadProducts(): Promise<void> {
    try {
      this.viewModel.isLoadingProducts = true;
      const pg = this.viewModel.pagination;
      this.productVm.pagination.PageNo = pg.PageNo;
      this.productVm.pagination.PageSize = pg.PageSize;
      this.productVm.searchstring = this.viewModel.searchTerm;
      if (this.viewModel.selectedCategoryId) {
        this.productVm.userProductViewModel.categoryId = this.viewModel.selectedCategoryId;
        const resp = await this.productService.getAllProductsByCategoryId(this.productVm.userProductViewModel);
        if (!resp.isError) {
          this.viewModel.products = resp.successData || [];
        }
      } else if (this.viewModel.searchTerm.trim()) {
        const q = new QueryFilter();
        q.skip = (pg.PageNo - 1) * pg.PageSize;
        q.top = pg.PageSize;
        const resp = await this.productService.getAllProductsBySearchString(this.viewModel.searchTerm, q);
        if (!resp.isError) {
          this.viewModel.products = resp.successData || [];
        }
      } else {
        const resp = await this.productService.getAllProducts(this.productVm);
        if (!resp.isError) {
          this.viewModel.products = resp.successData || [];
        }
      }
      (this.viewModel.products || []).forEach((p) => ProductUtils.initializeSelectedVariant(p));
    } catch (e) {
      await this._logHandler.logObject(e);
    } finally {
      this.viewModel.isLoadingProducts = false;
    }
  }

  getVariantPrice(product: ProductSM): number {
    const v = ProductUtils.getDefaultVariant(product);
    return v ? Number(v.price) : 0;
  }

  getVariantLabel(product: ProductSM): string {
    const v = ProductUtils.getDefaultVariant(product);
    if (!v) return '';
    return ProductUtils.getDisplayUnit(v) || v.unitValue?.name || v.sku || '';
  }

  getStockStatus(product: ProductSM): string {
    return ProductUtils.getStockStatus(product);
  }

  isOutOfStock(product: ProductSM): boolean {
    return ProductUtils.isOutOfStock(product);
  }

  getProductImage(product: ProductSM): string {
    return resolveProductImage(product) || '';
  }

  getMinQty(product: ProductSM): number {
    const v = ProductUtils.getDefaultVariant(product);
    return Number(v?.minOrderQuantity) || 1;
  }

  addToBulkList(product: ProductSM): void {
    const variant = ProductUtils.getDefaultVariant(product);
    if (!variant) return;
    const stock = ProductUtils.getStock(product);
    const item: BulkCartItem = {
      productId: product.id!,
      productVariantId: variant.id!,
      productName: product.name || '',
      sku: variant.sku,
      unit: ProductUtils.getDisplayUnit(variant) || variant.unitValue?.name,
      unitPrice: Number(variant.price),
      requestedQuantity: variant.minOrderQuantity || 1,
      minQuantity: variant.minOrderQuantity,
      availableQuantity: stock,
      stockStatus: ProductUtils.getStockStatus(product),
      imageUrl: this.getProductImage(product),
    };
    this.bulkCart.addItem(item);
    this._commonService.showSweetAlertToast({
      title: 'Added',
      text: `${product.name} added to bulk list`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
    this.viewModel.showCartPanel = true;
  }

  addCustomProduct(): void {
    if (!this.viewModel.customProduct.productName.trim()) return;
    this.bulkCart.addCustomItem({ ...this.viewModel.customProduct });
    this.viewModel.customProduct = {
      productName: '', description: '', requiredQuantity: 1,
      packaging: '', expectedDeliveryDate: '', additionalNotes: '',
    };
    this.viewModel.showCustomForm = false;
    this.viewModel.showCartPanel = true;
  }

  removeFromCart(variantId: number): void {
    this.bulkCart.removeItem(variantId);
  }

  removeCustom(index: number): void {
    this.bulkCart.removeCustomItem(index);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.viewModel.attachmentFiles = Array.from(input.files);
    }
  }

  goToStep(step: BulkOrdersViewModel['currentStep']): void {
    if (step !== 'products' && !this.viewModel.cartItems.length && !this.viewModel.customItems.length) {
      this._commonService.showSweetAlertToast({ title: 'Empty', text: 'Add products first', icon: 'warning' });
      return;
    }
    this.viewModel.currentStep = step;
    if (step === 'company') {
      this.viewModel.showCartPanel = false;
    }
    setTimeout(() => {
      const el = document.getElementById(step === 'company' ? 'bulk-company' : 'bulk-form');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  openBulkList(): void {
    this.viewModel.showCartPanel = true;
  }

  async submitRequest(): Promise<void> {
    const c = this.viewModel.companyInfo;
    if (!c.companyName || !c.contactPerson || !c.phone || !c.email || !c.shippingAddress || !c.city || !c.state || !c.pinCode) {
      this._commonService.showSweetAlertToast({ title: 'Required', text: 'Please fill all required company fields', icon: 'warning' });
      return;
    }

    try {
      this.viewModel.isSubmitting = true;
      await this._commonService.presentLoading();

      let attachments: { fileName: string; filePath: string; fileType?: string; fileSize?: number }[] = [];
      if (this.viewModel.attachmentFiles.length) {
        const up = await this.bulkOrderService.uploadAttachments(this.viewModel.attachmentFiles);
        if (!up.isError) attachments = up.successData || [];
      }

      const payload = {
        companyInfo: {
          ...c,
          billingAddress: this.viewModel.sameAsBilling ? c.shippingAddress : c.billingAddress,
        },
        items: this.viewModel.cartItems.map((i) => ({
          productId: i.productId,
          productVariantId: i.productVariantId,
          productName: i.productName,
          requestedQuantity: i.requestedQuantity,
          unitPrice: i.unitPrice,
          specialInstructions: i.specialInstructions,
          expectedDeliveryDate: i.expectedDeliveryDate,
          notes: i.notes,
        })),
        customRequests: this.viewModel.customItems,
        customerNotes: this.viewModel.customerNotes,
        attachments,
      };

      const resp = await this.bulkOrderService.createBulkOrder(payload);
      if (resp.isError) {
        this._commonService.showSweetAlertToast({ title: 'Error', text: resp.errorData.displayMessage, icon: 'error' });
        return;
      }

      this.viewModel.submittedOrderNumber = resp.successData?.orderNumber || '';
      this.bulkCart.clear();
      this._commonService.showSweetAlertToast({
        title: 'Request Submitted!',
        text: `Your bulk order ${this.viewModel.submittedOrderNumber} is pending approval.`,
        icon: 'success',
      });
      this.viewModel.currentStep = 'products';

      // Prompt for notifications so the customer can track bulk order status.
      void this._ensureBulkOrderPush(c.email, resp.successData?.customerId);
    } catch (e) {
      await this._logHandler.logObject(e);
    } finally {
      this.viewModel.isSubmitting = false;
      this._commonService.dismissLoader();
    }
  }

  /**
   * Best-effort: resolve customerId (from response or email) and ask to
   * subscribe for bulk order status pushes if not already granted.
   */
  private async _ensureBulkOrderPush(
    email?: string | null,
    customerId?: number | null
  ): Promise<void> {
    try {
      let id = customerId != null ? Number(customerId) : null;
      if (id == null && email) {
        const emailResp = await this.customerService.getCustomerByEmail(
          String(email).trim().toLowerCase()
        );
        if (
          !emailResp.isError &&
          emailResp.successData?.exists &&
          emailResp.successData?.customer?.id
        ) {
          id = Number(emailResp.successData.customer.id);
        }
      }
      await this.pushNotificationService.ensureSubscribedForOrderUpdates(id, 'bulk');
    } catch {
      /* notification wiring is non-critical for bulk submit */
    }
  }

  statusClass(status: string): string {
    return (status || '').replace(/_/g, '-');
  }
}
