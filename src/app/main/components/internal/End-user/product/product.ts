/**
 * Product Card Component
 */
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { WishlistService } from '../../../../../services/wishlist.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductUtils } from '../../../../../utils/product.utils';
import { resolveProductImage, handleProductImageError } from '../../../../../utils/image-url.util';

@Component({
  selector: 'app-product',
  templateUrl: './product.html',
  styleUrls: ['./product.scss'],
  imports: [CommonModule, FormsModule],
})
export class ProductCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) product!: ProductSM;

  @Input() currency = '₹';
  @Input() placeholder = 'assets/logo.png';
  @Input() showActions = true;

  @Output() addToCart = new EventEmitter<ProductSM>();
  @Output() view = new EventEmitter<ProductSM>();
  @Output() wishlist = new EventEmitter<ProductSM>();
  @Output() review = new EventEmitter<ProductSM>();

  // Expose utils to template
  utils = ProductUtils;

  private wishlistSub?: Subscription;

  constructor(
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('[ProductCard] ngOnInit for:', this.product?.name);
    this.initializeSelectedVariant();
    
    // Subscribe to wishlist changes
    this.wishlistSub = this.wishlistService.wishlist$.subscribe((wishlist) => {
      if (this.product) {
        const isNowWishlisted = wishlist.some(p => p.id === this.product.id);
        if (this.product.isWishlisted !== isNowWishlisted) {
          console.log('[ProductCard] Wishlist state changed for', this.product.name, ':', isNowWishlisted);
          this.product.isWishlisted = isNowWishlisted;
          this.cdr.detectChanges();
        }
      }
    });
    
    await this.setWishlistedFlag();
  }

  ngOnDestroy(): void {
    this.wishlistSub?.unsubscribe();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['product'] && !changes['product'].firstChange) {
      this.initializeSelectedVariant();
      await this.setWishlistedFlag();
    }
  }

  private initializeSelectedVariant(): void {
    ProductUtils.initializeSelectedVariant(this.product);
    this.cdr.detectChanges();
  }

  private async setWishlistedFlag(): Promise<void> {
    if (!this.product) return;
    const isWishlisted = await this.wishlistService.isWishlisted(this.product);
    console.log('[ProductCard] Initial wishlist check for', this.product.name, ':', isWishlisted);
    this.product.isWishlisted = isWishlisted;
    this.cdr.detectChanges();
  }

  get selectedVariant(): any {
    return ProductUtils.getSelectedVariant(this.product);
  }

  /**
   * Short tagline shown under the product name on the card.
   * Only shows subtitle — empty if none set.
   */
  get miniDescription(): string {
    const raw = (this.product?.subtitle || '')
      .toString()
      .replace(/<[^>]*>/g, '') // strip any HTML
      .replace(/\s+/g, ' ')
      .trim();
    if (!raw) return '';
    const MAX = 90;
    return raw.length > MAX ? raw.slice(0, MAX).trimEnd() + '…' : raw;
  }

  get availableVariants(): any[] {
    return ProductUtils.getAvailableVariants(this.product);
  }

  onVariantChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const variantId = Number(select.value);
    
    if (isNaN(variantId)) return;
    
    this.product.selectedVariantId = variantId;
    (this.product as any).__userSelectedVariant = true;
    this.product.cartQuantity = 1;
    this.cdr.detectChanges();
  }

  onVariantButtonClick(variantId: number): void {
    if (isNaN(variantId)) return;
    this.product.selectedVariantId = variantId;
    (this.product as any).__userSelectedVariant = true;
    this.product.cartQuantity = 1;
    this.cdr.detectChanges();
  }

  onAddToCart(): void {
    if (!ProductUtils.canAddToCart(this.product)) return;
    
    const variant = ProductUtils.getSelectedVariant(this.product);
    if (!variant) {
      console.warn('[ProductCard] Cannot add to cart without selected variant');
      return;
    }
    
    this.addToCart.emit(this.product);
  }

  onView(): void {
    this.view.emit(this.product);
  }

  onReviewClick(event: Event): void {
    event.stopPropagation();
    this.review.emit(this.product);
  }

  /**
   * Toggle wishlist - called from template click handler
   */
  handleWishlistClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    
    console.log('[ProductCard] Wishlist button clicked for:', this.product?.name);
    
    if (!this.product) {
      console.error('[ProductCard] No product!');
      return;
    }
    
    // Call async method
    this.toggleWishlistAsync();
  }

  private async toggleWishlistAsync(): Promise<void> {
    try {
      console.log('[ProductCard] Calling wishlist service for:', this.product.name);
      
      const added = await this.wishlistService.toggleWishlist(this.product);
      
      console.log('[ProductCard] Wishlist toggle result:', added ? 'added' : 'removed');
      
      // Update local state
      this.product.isWishlisted = added;
      this.cdr.detectChanges();
      
      // NOTE: Do NOT emit event here - the service already handles everything
      // Parent components subscribe to wishlistService.wishlist$ for updates
    } catch (error) {
      console.error('[ProductCard] Error toggling wishlist:', error);
    }
  }

  getImageSrc(): string {
    const withVariant = {
      ...this.product,
      selectedVariant: this.selectedVariant,
    };
    return resolveProductImage(withVariant, this.placeholder);
  }

  onImageError(event: Event): void {
    handleProductImageError(event, this.product?.id, this.placeholder);
  }
}
