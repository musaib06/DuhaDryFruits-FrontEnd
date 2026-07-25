import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponent } from '../../../../../base.component';
import { CheckoutViewModel } from '../../../../../models/view/end-user/checkout.viewmodel';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { CartService } from '../../../../../services/cart.service';
import { StorageService } from '../../../../../services/storage.service';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { CommonService } from '../../../../../services/common.service';
import { AppConstants } from '../../../../../../app-constants';
import { AddressType } from '../../../../../models/service-models/app/enums/address-type-s-m.enum';
import { CustomerService } from '../../../../../services/customer.service';
import { CustomerDetailSM } from '../../../../../models/service-models/app/v1/customer-detail-s-m';
import { CustomerAddressDetailSM } from '../../../../../models/service-models/app/v1/customer-address-detail-s-m';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ProductUtils } from '../../../../../utils/product.utils';
import { resolveProductImage } from '../../../../../utils/image-url.util';
import { Subscription } from 'rxjs';
import { PushNotificationService } from '../../../../../notification/services/push-notification.service';

// Razorpay Checkout Type Declaration
declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss'],
})
export class Checkout
  extends BaseComponent<CheckoutViewModel>
  implements OnInit, OnDestroy
{
  readonly MIN_ORDER_VALUE = 500;
  @ViewChild('customerForm') customerForm!: NgForm;

  // Expose ProductUtils to template
  utils = ProductUtils;

  savedCustomers: CustomerDetailSM[] = [];
  selectedCustomerId: number | null = null;
  isFormDisabled = false;
  currentCard: 'customer' | 'order' = 'customer';

  subTotal = 0;
  taxAmount = 0;
  shippingAmount = 0;
  couponCode = '';
  selectedAddressType: AddressType = AddressType.Home;
  
  // Razorpay state
  razorpayKeyId: string | null = null;
  isPaymentInProgress = false;
  isOrderCreating = false;
  private pendingCheckoutOrder: any | null = null;
  private cartSub: Subscription | null = null;

  constructor(
    commonService: CommonService,
    logHandlerService: LogHandlerService,
    private cartService: CartService,
    private storageService: StorageService,
    private customerService: CustomerService,
    private router: Router,
    private http: HttpClient,
    private pushNotificationService: PushNotificationService
  ) {
    super(commonService, logHandlerService);
    this.viewModel = new CheckoutViewModel();
  }

  async ngOnInit() {
    this.subscribeToCartChanges();
    await this.loadSavedCustomers();
    await this.loadCart();
    this.selectedAddressType = AddressType.Home;
    this.viewModel.homeAddress.addressType = AddressType.Home;
    this.enforceIndiaCountry();

    // Prefetch payment SDK + key in background — do not block the form.
    void this.ensureRazorpaySdk().catch(() => undefined);
    void this.loadRazorpayKey();
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  private subscribeToCartChanges(): void {
    this.cartSub = this.cartService.cart$.subscribe((items) => {
      this.viewModel.cartItems = (items || []) as ProductSM[];
      this.viewModel.cartItems.forEach((item) => {
        if (!item.cartQuantity || item.cartQuantity < 1) {
          item.cartQuantity = 1;
        }
        ProductUtils.initializeSelectedVariant(item);
      });
      this.recalculate();
      this.clearPendingCheckoutIfCartChanged();
    });
  }

  private clearPendingCheckoutIfCartChanged(): void {
    if (!this.pendingCheckoutOrder?.order) return;
    const pendingAmount = Number(this.pendingCheckoutOrder.order.amount);
    const cartTotal = Number(this.viewModel.totalPrice);
    if (!Number.isFinite(pendingAmount) || Math.abs(pendingAmount - cartTotal) > 0.01) {
      this.pendingCheckoutOrder = null;
    }
  }

  /**
   * Load Razorpay Checkout SDK only when needed (not on every page via index.html).
   */
  private ensureRazorpaySdk(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Razorpay requires a browser'));
    }
    if (typeof Razorpay !== 'undefined') {
      return Promise.resolve();
    }
    const existing = document.querySelector(
      'script[data-razorpay-sdk="1"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error('Failed to load Razorpay SDK')),
          { once: true }
        );
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset['razorpaySdk'] = '1';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Load Razorpay public key from backend (secure)
   */
  async loadRazorpayKey(): Promise<void> {
    try {
      const resp = await this.customerService.getRazorpayKey();
      if (resp.isError) {
        console.error('[Checkout] Failed to load Razorpay key:', resp.errorData);
        // Don't block UI, will retry when payment is initiated
      } else {
        this.razorpayKeyId = resp.successData?.keyId || null;
        console.log('[Checkout] Razorpay key loaded successfully');
      }
    } catch (error) {
      console.error('[Checkout] Error loading Razorpay key:', error);
      // Don't block UI, will retry when payment is initiated
    }
  }

  async loadSavedCustomers() {
    try {
      const saved: CustomerDetailSM[] =
        (await this.storageService.getFromStorage(
          AppConstants.DbKeys.SAVED_CUSTOMER_DETAILS
        )) || [];
      this.savedCustomers = saved.slice(0, 10);
    } catch (error) {
      this.savedCustomers = [];
    }
  }

  selectCustomer(event: any) {
    if (event.target.value == null) return;
    let customerId = Number(event.target.value);
    if (!customerId) return;
    const id = Number(customerId);
    const customer = this.savedCustomers.find((c) => c.id === id);
    if (!customer) return;

    this.selectedCustomerId = id;
    this.isFormDisabled = true;
    this.viewModel.customer = { ...customer };
    this.viewModel.createdCustomer = { ...customer };

    const homeAddr = customer.addresses?.find(
      (a) => a.addressType === AddressType.Home
    );
    if (homeAddr) this.viewModel.homeAddress = { ...homeAddr };
    this.enforceIndiaCountry();
  }

  async deleteCustomer(customerId: number, event: Event) {
    event.stopPropagation();
    this.savedCustomers = this.savedCustomers.filter(
      (c) => c.id !== customerId
    );
    await this.storageService.saveToStorage(
      AppConstants.DbKeys.SAVED_CUSTOMER_DETAILS,
      this.savedCustomers
    );
    if (this.selectedCustomerId === customerId) this.clearForm();
  }

  addNewDetails() {
    this.clearForm();
  }

  clearForm() {
    this.selectedCustomerId = null;
    this.isFormDisabled = false;
    this.viewModel.customer = new CustomerDetailSM();
    this.viewModel.homeAddress = new CustomerAddressDetailSM();
    this.enforceIndiaCountry();
    this.selectedAddressType = AddressType.Home;
    this.viewModel.submitted = false;
  }

  private enforceIndiaCountry(): void {
    if (!this.viewModel.homeAddress) {
      this.viewModel.homeAddress = new CustomerAddressDetailSM();
    }
    this.viewModel.homeAddress.country = 'India';
  }

  validateForm(): boolean {
    const { firstName, lastName, email, contact } = this.viewModel.customer;
    const a = this.viewModel.homeAddress;
    if (!firstName || !lastName || !email || !contact) {
      this._commonService.showSweetAlertToast({
        title: 'Validation Error',
        text: 'Please fill all required customer fields.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this._commonService.showSweetAlertToast({
        title: 'Validation Error',
        text: 'Please enter a valid email address.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }
    if (!/^\d{10}$/.test(contact)) {
      this._commonService.showSweetAlertToast({
        title: 'Validation Error',
        text: 'Contact number must be 10 digits.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }
    if (!a.addressLine1 || !a.city || !a.state || !a.country || !a.postalCode) {
      this._commonService.showSweetAlertToast({
        title: 'Validation Error',
        text: 'Please fill all required address fields.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return false;
    }
    return true;
  }

  async onSubmit() {
    if (this.selectedCustomerId !== null) {
      this.currentCard = 'order';
      return;
    }
    try {
      this.viewModel.submitted = true;
      
      // Validate required fields
      if (!this.viewModel.customer.email || !this.viewModel.customer.email.trim()) {
        this._commonService.showSweetAlertToast({
          title: 'Email Required',
          text: 'Please enter your email address to continue.',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
        return;
      }

      // Validate contact is provided and is 10 digits
      if (!this.viewModel.customer.contact || !this.viewModel.customer.contact.toString().trim()) {
        this._commonService.showSweetAlertToast({
          title: 'Contact Required',
          text: 'Please enter your 10-digit mobile number to continue.',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
        return;
      }

      // Ensure contact is properly formatted (10 digits only, no spaces or special chars)
      const cleanedContact = String(this.viewModel.customer.contact).replace(/\D/g, '');
      
      if (cleanedContact.length !== 10) {
        this._commonService.showSweetAlertToast({
          title: 'Invalid Contact Number',
          text: 'Contact number must be exactly 10 digits.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }

      this.viewModel.customer.contact = cleanedContact;

      this.enforceIndiaCountry();
      this.viewModel.homeAddress.addressType = this.selectedAddressType;
      this.viewModel.customer.addresses = [this.viewModel.homeAddress];
      
      // Ensure email is lowercase and trimmed
      if (this.viewModel.customer.email) {
        this.viewModel.customer.email = this.viewModel.customer.email.trim().toLowerCase();
      }
      
      // Ensure names are trimmed
      if (this.viewModel.customer.firstName) {
        this.viewModel.customer.firstName = this.viewModel.customer.firstName.trim();
      }
      if (this.viewModel.customer.lastName) {
        this.viewModel.customer.lastName = this.viewModel.customer.lastName.trim();
      }
      
      this._commonService.presentLoading();

      // Smart customer creation: Handles both new and existing customers seamlessly
      // Backend will return existing customer if email exists, or create new one
      const resp = await this.customerService.createCustomer(
        this.viewModel.customer
      );

      if (resp.isError) {
        // If error is "customer already exists", try to fetch existing customer
        if (resp.errorData?.displayMessage?.toLowerCase().includes('already exists')) {
          console.log('[Checkout] Customer exists, fetching existing customer...');
          const emailCheckResp = await this.customerService.getCustomerByEmail(this.viewModel.customer.email);
          
          if (!emailCheckResp.isError && emailCheckResp.successData?.exists && emailCheckResp.successData?.customer) {
            // Use existing customer
            this.viewModel.createdCustomer = emailCheckResp.successData.customer;
            this._handleCustomerSuccess(true); // isExisting = true
            return;
          }
        }
        
        // Other errors - show error message
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        // Success - customer created or found
        if (!resp.successData) {
          console.error('[Checkout] Response success but successData is null/undefined:', resp);
          this._commonService.showSweetAlertToast({
            title: 'Error',
            text: 'Customer creation failed. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
          });
          return;
        }
        
        this.viewModel.createdCustomer = resp.successData;
        console.log('[Checkout] Customer created/retrieved successfully:', this.viewModel.createdCustomer);
        
        // Validate customer data
        if (!this.viewModel.createdCustomer || !this.viewModel.createdCustomer.id) {
          console.error('[Checkout] Invalid customer data received:', this.viewModel.createdCustomer);
          this._commonService.showSweetAlertToast({
            title: 'Error',
            text: 'Invalid customer data received. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
          });
          return;
        }
        
        const isExisting = (resp.successData as any)?.isExisting || false;
        this._handleCustomerSuccess(isExisting);
      }
    } catch (error) {
      console.error('[Checkout] Error in onSubmit:', error);
      this._exceptionHandler.handleError(error);
    } finally {
      this._commonService.dismissLoader();
    }
  }

  /**
   * Handle successful customer creation/retrieval
   * Saves to IndexedDB and proceeds to order
   */
  private _handleCustomerSuccess(isExisting: boolean = false) {
    // Link this browser's FCM device token to the identified customer so the
    // admin can later target "registered / selected customers". Best-effort:
    // never block checkout on notification wiring.
    this._linkDeviceToCustomer(this.viewModel.createdCustomer?.id);

    // Check if customer already in saved list
    const alreadySaved = this.savedCustomers.some(c => c.id === this.viewModel.createdCustomer.id);
    
    if (!alreadySaved) {
      // Add to saved customers (limit 10)
      if (this.savedCustomers.length >= 10) {
        this.savedCustomers.shift();
      }
      this.savedCustomers.push(this.viewModel.createdCustomer);
      
      // Save to IndexedDB
      this.storageService.saveToStorage(
        AppConstants.DbKeys.SAVED_CUSTOMER_DETAILS,
        this.savedCustomers
      ).catch(err => {
        console.warn('[Checkout] Failed to save customer to IndexedDB:', err);
        // Don't block checkout if IndexedDB save fails
      });
    }

    // Show appropriate message
    if (isExisting) {
      this._commonService.showSweetAlertToast({
        title: 'Welcome Back!',
        text: 'Your details have been loaded. You can proceed to checkout.',
        icon: 'success',
        confirmButtonText: 'OK',
      });
    } else {
      this._commonService.showSweetAlertToast({
        title: 'Success',
        text: 'Your details have been saved. Proceeding to checkout.',
        icon: 'success',
        confirmButtonText: 'OK',
      });
    }

    // Proceed to order
    this.currentCard = 'order';
    this.selectedCustomerId = this.viewModel.createdCustomer.id;
  }

  /**
   * Best-effort: associate this browser's push device token with the customer
   * so admins can target registered/selected customers. Fire-and-forget.
   */
  private _linkDeviceToCustomer(customerId?: number | null): void {
    if (customerId == null) return;
    this.pushNotificationService
      .linkTokenToCustomer(Number(customerId))
      .catch(() => {
        /* notification linking is non-critical for checkout */
      });
  }

  async loadCart() {
    try {
      this.viewModel.cartItems = (await this.cartService.getAll()) || [];
    } catch {
      this.viewModel.cartItems = [];
    }
    
    // Initialize selected variant for each cart item
    this.viewModel.cartItems.forEach((item: ProductSM) => {
      if (!item.cartQuantity || item.cartQuantity < 1) item.cartQuantity = 1;
      ProductUtils.initializeSelectedVariant(item);
    });
    
    this.recalculate();
  }

  imageOf(item: ProductSM): string {
    return resolveProductImage(item, 'assets/logo.png');
  }

  onProductImageError(event: Event, productId?: number): void {
    this._commonService.onProductImageError(event, productId, 'assets/logo.png');
  }

  /**
   * Get variant for display using ProductUtils
   */
  getSelectedVariant(item: ProductSM): any {
    return ProductUtils.getSelectedVariant(item);
  }

  /**
   * Get price for item using ProductUtils
   */
  getItemPrice(item: ProductSM): number {
    return ProductUtils.getPrice(item);
  }

  /**
   * Get SKU for item using ProductUtils
   */
  getItemSku(item: ProductSM): string {
    return ProductUtils.getSku(item);
  }

  /**
   * Get unit display for item
   */
  getItemUnitDisplay(item: ProductSM): string {
    return ProductUtils.getVariantSizeAndWeightLabel(item);
  }

  /**
   * Calculate item total
   */
  getItemTotal(item: ProductSM): number {
    const unitPrice = ProductUtils.getPrice(item);
    const quantity = item.cartQuantity || 1;
    const shipping = ProductUtils.getShippingCharge(item);
    return unitPrice * quantity + (shipping > 0 ? shipping * quantity : 0);
  }

  /**
   * Update cart item quantity
   */
  async updateCart(item: ProductSM) {
    item.cartQuantity = Number(item.cartQuantity) || 1;
    await this.cartService.updateCartItem(item.id, item.cartQuantity, item.selectedVariantId);
    this.recalculate();
  }

  /**
   * Remove item from cart
   */
  async removeItem(item: ProductSM) {
    await this.cartService.removeById(item.id, item.selectedVariantId);
    this.viewModel.cartItems = this.viewModel.cartItems.filter(
      (x) => x !== item
    );
    this.recalculate();
  }

  async clearCart() {
    await this.cartService.clearCart();
    this.viewModel.cartItems = [];
    this.recalculate();
  }

  /**
   * Recalculate totals using ProductUtils for variant prices
   */
  recalculate() {
    const items = this.viewModel.cartItems || [];
    
    // Calculate subtotal using variant prices
    this.subTotal = items.reduce((acc, item) => {
      const price = ProductUtils.getPrice(item);
      return acc + price * (item.cartQuantity || 1);
    }, 0);
    
    // Calculate tax using variant prices
    this.taxAmount = items.reduce((acc, item) => {
      const price = ProductUtils.getPrice(item);
      const taxRate = item.taxRate || 0;
      return acc + (price * (item.cartQuantity || 1) * taxRate) / 100;
    }, 0);
    
    // Per-product optional shipping (applied per unit when defined)
    this.shippingAmount = items.reduce((acc, item) => {
      const shipping = ProductUtils.getShippingCharge(item);
      const qty = item.cartQuantity || 1;
      if (!shipping || shipping <= 0) {
        return acc;
      }
      return acc + shipping * qty;
    }, 0);

    // Apply coupon discount
    const couponDiscount = this.calculateCouponDiscount(this.subTotal);
    const total = this.subTotal + this.taxAmount + this.shippingAmount - couponDiscount;
    this.viewModel.totalPrice = Math.max(0, Number(total.toFixed(2)));
  }

  calculateCouponDiscount(subtotal: number): number {
    const code = (this.couponCode || '').trim().toUpperCase();
    if (!code) return 0;
    if (code === 'SAVE50') return Math.min(50, subtotal);
    if (code === 'PCT10') return +(subtotal * 0.1).toFixed(2);
    return 0;
  }

  applyCoupon() {
    this.recalculate();
  }

  get shippingLabel(): string {
    return this.shippingAmount === 0
      ? 'Free'
      : `₹${this.shippingAmount.toFixed(2)}`;
  }

  canProceed(): boolean {
    return (
      this.viewModel.cartItems?.length > 0 && this.viewModel.totalPrice >= this.MIN_ORDER_VALUE
    );
  }

  get isBelowMinimumOrderValue(): boolean {
    return (this.viewModel.cartItems?.length || 0) > 0 && this.viewModel.totalPrice < this.MIN_ORDER_VALUE;
  }

  get minimumOrderRemainingAmount(): number {
    return Math.max(0, this.MIN_ORDER_VALUE - this.viewModel.totalPrice);
  }

  get submitButtonLabel(): string {
    return this.selectedCustomerId !== null ? 'Next' : 'Create';
  }

  backToCustomer() {
    this.currentCard = 'customer';
  }

  /**
   * Proceed to payment
   * Creates order with variant-specific data:
   * - productId
   * - variantId (productVariantId)
   * - variantPrice
   * - unitSymbol
   * - quantity
   * - sku
   */
  async proceedToPayment() {
    if (this.isOrderCreating || this.isPaymentInProgress) {
      return;
    }

    if (!this.canProceed()) {
      this._commonService.showSweetAlertToast({
        title: 'Minimum Order Value',
        text: 'Please add another item or increase quantity. Minimum order value is Rs 500/-',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }
    this.recalculate();

    // Validate all items have selected variants
    for (const item of this.viewModel.cartItems) {
      const variant = ProductUtils.getSelectedVariant(item);
      if (!variant) {
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: `Product "${item.name}" does not have a selected variant. Please refresh and try again.`,
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }
    }

    // Build order items with full variant information
    const orderItems = this.viewModel.cartItems.map((item) => {
      const variant = ProductUtils.getSelectedVariant(item);
      return {
        productId: item.id,
        productVariantId: variant.id,
        variantPrice: variant.price,
        unitSymbol: variant.unitSymbol || variant.unitName || '',
        quantity: item.cartQuantity || 1,
        sku: variant.sku || '',
      };
    });

    const payload = {
      customerId: this.viewModel.createdCustomer.id,
      items: orderItems,
      subtotal: this.subTotal,
      taxAmount: this.taxAmount,
      shippingAmount: this.shippingAmount,
      totalAmount: this.viewModel.totalPrice,
      couponCode: this.couponCode || null,
    };
    
    console.log('[Checkout] Order payload:', payload);

    const pending = this.pendingCheckoutOrder;
    if (
      pending?.order?.razorpayOrderId &&
      Math.abs(Number(pending.order.amount) - this.viewModel.totalPrice) < 0.01
    ) {
      await this.openRazorpayCheckout(pending);
      return;
    }

    try {
      this.isOrderCreating = true;
      this._commonService.presentLoading();
      
      // Create Backend Order
      let resp = await this.customerService.proccedToOrder(payload);
      
      if (resp.isError) {
        const msg = resp.errorData?.displayMessage || 'Failed to create order.';
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: msg,
          icon: 'error',
          confirmButtonText: 'OK',
        });

        // If backend detected outdated cart items, clear local cart so user can re-add with fresh prices
        if (msg && msg.toLowerCase().includes('outdated items')) {
          await this.cartService.clearCart();
          await this.loadCart();
        }

        return;
      }
      
      const createRes = resp.successData;
      if (!createRes) {
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Failed to create order. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }

      // Validate order data
      if (!createRes.order?.razorpayOrderId) {
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Invalid order response. Missing Razorpay order ID.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }

      // Ensure Razorpay key is loaded
      if (!this.razorpayKeyId) {
        await this.loadRazorpayKey();
        if (!this.razorpayKeyId) {
          this._commonService.showSweetAlertToast({
            title: 'Error',
            text: 'Payment gateway not available. Please refresh and try again.',
            icon: 'error',
            confirmButtonText: 'OK',
          });
          return;
        }
      }

      // Open Razorpay Checkout
      this.pendingCheckoutOrder = createRes;
      await this.openRazorpayCheckout(createRes);
    } catch (err: any) {
      console.error('[Checkout] Order error:', err);
      this._commonService.showSweetAlertToast({
        title: 'Order Error',
        text: err.message || 'Order failed! Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this.isOrderCreating = false;
      this._commonService.dismissLoader();
    }
  }

  /**
   * Open Razorpay Checkout with Cards, UPI, and Netbanking only
   */
  async openRazorpayCheckout(orderData: any): Promise<void> {
    if (this.isPaymentInProgress) {
      console.warn('[Checkout] Payment already in progress');
      return;
    }

    // Validate Razorpay SDK is loaded (fetch on demand — not bundled in index.html)
    try {
      await this.ensureRazorpaySdk();
    } catch {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Payment gateway SDK not loaded. Please check your connection and try again.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    if (typeof Razorpay === 'undefined') {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Payment gateway SDK not loaded. Please refresh the page.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    const order = orderData.order;
    const customer = order.customerDetails || this.viewModel.createdCustomer;

    try {
      this.isPaymentInProgress = true;

      const options = {
        key: this.razorpayKeyId, // Public key from backend
        amount: Math.round(orderData.order.amount * 100), // Convert to paise
        currency: 'INR',
        name: 'Duha Dryfruits',
        description: `Order #${order.id}`,
        order_id: order.razorpayOrderId,
        
        // Prefill customer details
        prefill: {
          name: customer?.name || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Customer',
          email: customer?.email || '',
          contact: customer?.contact || '',
        },
        
        // Theme customization
        theme: {
          color: '#3399cc',
        },
        
        // Payment method configuration - Only Cards, UPI, Netbanking
        method: {
          netbanking: true,
          wallet: false, // Disabled
          upi: true,
          card: true,
          emi: false, // Disabled
          paylater: false, // Disabled
        },
        
        // Handler for successful payment
        handler: async (response: any) => {
          console.log('[Checkout] Payment success response:', response);
          await this.handlePaymentSuccess(response, order.id);
        },
        
        // Handler for payment failure
        modal: {
          ondismiss: () => {
            console.log('[Checkout] Payment cancelled by user');
            this.isPaymentInProgress = false;
            this._commonService.showSweetAlertToast({
              title: 'Payment Cancelled',
              text: 'You cancelled the payment. Your order is still pending.',
              icon: 'info',
              confirmButtonText: 'OK',
            });
          },
        },
        
        // Additional security options
        retry: {
          enabled: true,
          max_count: 3,
        },
        
        // Readonly fields for security
        readonly: {
          email: !!customer?.email,
          contact: !!customer?.contact,
        },
      };

      console.log('[Checkout] Opening Razorpay Checkout with options:', {
        ...options,
        key: '***HIDDEN***', // Don't log the key
      });

      const razorpay = new Razorpay(options);
      
      razorpay.on('payment.failed', (response: any) => {
        console.error('[Checkout] Payment failed:', response);
        this.isPaymentInProgress = false;
        this.handlePaymentFailure(response);
      });

      razorpay.on('payment.authorized', (response: any) => {
        console.log('[Checkout] Payment authorized:', response);
        // This is for card payments that need authorization
      });

      razorpay.open();
      
    } catch (error: any) {
      console.error('[Checkout] Razorpay Checkout error:', error);
      this.isPaymentInProgress = false;
      
      this._commonService.showSweetAlertToast({
        title: 'Payment Error',
        text: error.message || 'Failed to open payment gateway. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(response: any, orderId: number): Promise<void> {
    try {
      this._commonService.presentLoading();
      this.isPaymentInProgress = false;

      // Validate response structure
      if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
        throw new Error('Invalid payment response structure');
      }

      // Verify payment with backend
      const verifyPayload = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      };

      console.log('[Checkout] Verifying payment with backend:', {
        ...verifyPayload,
        razorpay_signature: '***HIDDEN***',
      });

      const verifyResp = await this.customerService.verifyPayment(verifyPayload);

      if (verifyResp.isError) {
        throw new Error(verifyResp.errorData?.displayMessage || 'Payment verification failed');
      }

      // Payment verified successfully
      this.pendingCheckoutOrder = null;
      await this.cartService.clearCart();

      this._commonService.showSweetAlertToast({
        title: 'Payment Successful!',
        text: 'Your order has been confirmed. You will receive an email confirmation shortly.',
        icon: 'success',
        confirmButtonText: 'OK',
      });

      // Redirect to home or order success page
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);

    } catch (error: any) {
      console.error('[Checkout] Payment verification error:', error);
      
      this._commonService.showSweetAlertToast({
        title: 'Verification Error',
        text: error.message || 'Payment was successful but verification failed. Please contact support with order ID: ' + orderId,
        icon: 'warning',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(response: any): Promise<void> {
    const razorpayOrderId =
      response?.error?.metadata?.order_id ||
      this.pendingCheckoutOrder?.order?.razorpayOrderId;

    if (razorpayOrderId) {
      try {
        await this.customerService.markOrderPaymentFailed({
          razorpay_order_id: razorpayOrderId,
        });
      } catch (err) {
        console.error('[Checkout] Failed to mark order as failed:', err);
      }
    }

    let errorMessage = 'Payment failed. Please try again.';
    
    if (response.error) {
      const error = response.error;
      if (error.code === 'BAD_REQUEST_ERROR') {
        errorMessage = error.description || errorMessage;
      } else if (error.code === 'GATEWAY_ERROR') {
        errorMessage = 'Payment gateway error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
    }

    this._commonService.showSweetAlertToast({
      title: 'Payment Failed',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'OK',
    });
  }

  /**
   * Legacy verify payment method (kept for compatibility)
   */
  verifyPayment(order: any) {
    const { razorpayOrderId, paymentId, signature } = order;
    let payload = { 
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature 
    };
    console.log('[Checkout] Verifying payment:', {
      ...payload,
      razorpay_signature: '***HIDDEN***',
    });
    return this.customerService.verifyPayment(payload);
  }
}
