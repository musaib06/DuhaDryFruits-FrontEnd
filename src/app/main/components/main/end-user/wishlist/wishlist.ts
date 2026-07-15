import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { WishlistService } from '../../../../../services/wishlist.service';
import { TabResumeService } from '../../../../../services/tab-resume.service';
import { FormsModule } from '@angular/forms';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { BaseComponent } from '../../../../../base.component';
import { WishListViewModel } from '../../../../../models/view/end-user/wishlist.viewmodel';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { CartService } from '../../../../../services/cart.service';
import { ProductUtils } from '../../../../../utils/product.utils';
import { generateProductSlug } from '../../../../../utils/slug.utils';
import { resolveProductImage } from '../../../../../utils/image-url.util';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class WishlistComponent
  extends BaseComponent<WishListViewModel>
  implements OnInit, OnDestroy
{
  // Expose utils to template
  utils = ProductUtils;
  
  private wishlistSub?: Subscription;
  private originalItems: ProductSM[] = [];
  private readonly isBrowser: boolean;
  private tabResumeTeardown: (() => void) | null = null;

  constructor(
    commonService: CommonService,
    loghandlerService: LogHandlerService,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private tabResume: TabResumeService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    super(commonService, loghandlerService);
    this.viewModel = new WishListViewModel();
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit() {
    this.detectMobile();
    
    // Subscribe to wishlist changes
    this.wishlistSub = this.wishlistService.wishlist$.subscribe((items) => {
      console.log('[WishlistPage] Received wishlist update:', items?.length, 'items');
      this.originalItems = items || [];
      this.viewModel.allItems = [...this.originalItems];
      this.viewModel.totalCount = this.viewModel.allItems.length;
      this.cdr.detectChanges();
    });
    
    // Initial load
    await this.loadWishlist();
    this.tabResumeTeardown = this.tabResume.subscribe(() => void this.loadWishlist());
  }
  
  ngOnDestroy(): void {
    this.tabResumeTeardown?.();
    this.tabResumeTeardown = null;
    this.wishlistSub?.unsubscribe();
  }
  
  private async loadWishlist() {
    console.log('[WishlistPage] Loading wishlist...');
    const items = await this.wishlistService.getAll();
    console.log('[WishlistPage] Loaded', items.length, 'items');
    this.originalItems = items;
    this.viewModel.allItems = [...items];
    this.viewModel.totalCount = items.length;
    this.cdr.detectChanges();
  }

  detectMobile() {
    this.viewModel.isMobile = this.isBrowser && window.innerWidth <= 768;
  }

  async moveToCart(item: ProductSM) {
    try {
      const removed = await this.wishlistService.removeById(item.id);
      if (removed) {
        await this.cartService.toggleCart(item);
      }
    } catch (error) {
      console.error('Error moving item to cart:', error);
    }
  }

  shareItem(item: ProductSM) {
    if (!this.isBrowser) {
      return;
    }
    const variant = ProductUtils.getSelectedVariant(item);
    if (!variant) return;

    const unitText = ProductUtils.getDisplayUnit(variant) || `${variant.quantity}`;

    const price = variant.price;

    const shareText = `${item.name} (${unitText}) — ₹${price}`;

    const productSlug = generateProductSlug(item.name, item.id);
    const shareUrl =
      `${window.location.origin}/product/${productSlug}?variant=${variant.id}`;

    if ((navigator as any).share) {
      (navigator as any)
        .share({
          title: item.name,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(`${shareText} — ${shareUrl}`)
        .then(() => this._commonService.ShowToastAtTopEnd('Link copied!', 'success'))
        .catch(() =>
          this._commonService.ShowToastAtTopEnd('Could not copy link', 'error')
        );
    } else {
      this._commonService.ShowToastAtTopEnd(
        'Sharing not supported in this browser',
        'info'
      );
    }
  }

  /**
   * Remove item from wishlist
   */
  async removeFromWishlist(id: number, variantId?: number) {
    await this.wishlistService.removeById(id);
  }

  async applySearch() {
    if (this.viewModel.searchTerm && this.viewModel.searchTerm.trim()) {
      const searchLower = this.viewModel.searchTerm.toLowerCase();
      this.viewModel.allItems = this.originalItems.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    } else {
      this.viewModel.allItems = [...this.originalItems];
    }
    this.cdr.detectChanges();
  }

  async getAllWishlistItems() {
    return await this.wishlistService.getAll();
  }

  productImage(item: ProductSM): string {
    return resolveProductImage(item);
  }
}
