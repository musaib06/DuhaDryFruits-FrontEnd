import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../base.component';
import { CartViewModel } from '../../../../../models/view/end-user/cart.viewmodel';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { IndexedDBStorageService } from '../../../../../services/indexdb.service';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { CartService } from '../../../../../services/cart.service';
import { Router, RouterModule } from '@angular/router';
import { ProductUtils } from '../../../../../utils/product.utils';
import { resolveProductImage } from '../../../../../utils/image-url.util';
import { TabResumeService } from '../../../../../services/tab-resume.service';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartComponent
  extends BaseComponent<CartViewModel>
  implements OnInit, OnDestroy
{
  readonly MIN_ORDER_VALUE = 500;
  // Expose utils to template
  utils = ProductUtils;

  private tabResumeTeardown: (() => void) | null = null;

  constructor(
    commonService: CommonService,
    loghandler: LogHandlerService,
    private IndexDbStorageService: IndexedDBStorageService,
    private cartService: CartService,
    private router: Router,
    private tabResume: TabResumeService,
  ) {
    super(commonService, loghandler);
    this.viewModel = new CartViewModel();
  }

  async ngOnInit() {
    await this.loadCart();
    this.tabResumeTeardown = this.tabResume.subscribe(() => void this.loadCart());
  }

  ngOnDestroy(): void {
    this.tabResumeTeardown?.();
    this.tabResumeTeardown = null;
  }

  /**
   * Load cart items and calculate totals
   */
  async loadCart() {
    this.viewModel.cartItems = await this.cartService.getAll();
    console.log('Cart items:', this.viewModel.cartItems);

    // Calculate subtotal using utility for variant price
    this.viewModel.subTotal = this.viewModel.cartItems.reduce(
      (sum, item) => {
        const price = ProductUtils.getPrice(item);
        return sum + price * (item.cartQuantity || 1);
      },
      0
    );
    this.viewModel.tax = this.viewModel.subTotal * this.viewModel.taxRate;
    this.viewModel.total = this.viewModel.subTotal + this.viewModel.tax;
  }

  /**
   * Update cart item quantity
   */
  async updateQuantity(item: ProductSM, event: any) {
    const qty = Number(event.target.value) || item.cartQuantity;
    await this.cartService.updateCartItem(item.id, qty, item.selectedVariantId);
    await this.loadCart();
  }

  /**
   * Remove item from cart
   */
  async removeItem(item: ProductSM) {
    await this.cartService.removeById(item.id, item.selectedVariantId);
    await this.loadCart();
  }

  async clearCart() {
    await this.cartService.clearCart();
    await this.loadCart();
  }

  increment(item: ProductSM) {
    item.cartQuantity++;
    this.saveCart();
  }

  decrement(item: ProductSM) {
    if (item.cartQuantity > 1) {
      item.cartQuantity--;
      this.saveCart();
    }
  }

  async saveCart() {
    for (const item of this.viewModel.cartItems) {
      await this.cartService.updateCartItem(item.id, item.cartQuantity, item.selectedVariantId);
    }
    await this.loadCart();
  }

  proceedToCheckout() {
    if ((this.viewModel.total || 0) < this.MIN_ORDER_VALUE) {
      this._commonService.showSweetAlertToast({
        title: 'Minimum Order Value',
        text: 'Please add another item or increase quantity. Minimum order value is Rs 500/-',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }
    this.router.navigate(['/checkout']);
  }

  imageError(event: Event, item?: ProductSM) {
    this._commonService.onProductImageError(event, item?.id, 'assets/logo.png');
  }

  productImage(item: ProductSM): string {
    return resolveProductImage(item);
  }
}
