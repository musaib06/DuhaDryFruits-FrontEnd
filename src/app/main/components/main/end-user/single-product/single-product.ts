import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PendingTasks, PLATFORM_ID, inject } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';

import { BaseComponent } from '../../../../../base.component';
import { UserProductViewModel } from '../../../../../models/view/end-user/product/user-product.viewmodel';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';

import { ProductService } from '../../../../../services/product.service';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { CartService } from '../../../../../services/cart.service';
import { WishlistService } from '../../../../../services/wishlist.service';

import { ProductCardComponent } from '../../../internal/End-user/product/product';
import { ReviewSM } from '../../../../../models/service-models/app/v1/review-s-m';
import { ProductFaqSM } from '../../../../../models/service-models/app/v1/product-faq-s-m';
import { ReviewService } from '../../../../../services/review.service';
import { ProductUtils } from '../../../../../utils/product.utils';
import { extractProductIdFromSlug, generateProductSlug } from '../../../../../utils/slug.utils';
import { resolveImageUrl, productShareImageUrl, normalizeProductListImageUrl } from '../../../../../utils/image-url.util';
import { htmlToPlainText, truncatePlainText } from '../../../../../utils/html-to-plain-text.util';

@Component({
  selector: 'app-product-page',
  templateUrl: './single-product.html',
  styleUrls: ['./single-product.scss'],
  imports: [RouterModule, CommonModule, FormsModule, ProductCardComponent],
})
export class SingleProduct
  extends BaseComponent<UserProductViewModel>
  implements OnInit, OnDestroy
{
  private readonly isBrowser: boolean;
  private visibilityHandler: (() => void) | null = null;
  /** Debounce + avoid refetch storm when tab wakes before TCP is ready */
  private visibilityRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private onlineRetryHandler: (() => void) | null = null;
  /** Cancels stale async work when route param changes quickly (e.g. video → product). */
  private productLoadSeq = 0;
  private readonly pendingTasks = inject(PendingTasks);
  // Expose utils to template
  utils = ProductUtils;
  /** Ids of currently expanded FAQ accordion items. */
  expandedFaqIds = new Set<number>();
  /** DOM id of the injected JSON-LD script (FAQPage structured data). */
  private readonly faqJsonLdId = 'faq-jsonld';

  constructor(
    commonService: CommonService,
    private logHandlerService: LogHandlerService,
    private activatedRoute: ActivatedRoute,
    private productService: ProductService,
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private reviewService: ReviewService,
    private meta: Meta,
    private title: Title,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    super(commonService, logHandlerService);
    this.viewModel = new UserProductViewModel();
    this.isBrowser = isPlatformBrowser(platformId);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (this.isBrowser) {
          if (/\/dry-fruits\//.test(event.urlAfterRedirects)) {
            this._commonService.stripBootstrapModalArtifacts();
          }
          // Scroll-to-top is handled centrally in the root App component
          // (router NavigationEnd) to avoid competing scroll animations.
        }
        this._commonService.dismissLoader();
      }
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['slug']) {
        const productId = extractProductIdFromSlug(params['slug']);
        if (productId) {
          const completePendingTask = this.pendingTasks.add();
          void this.loadProductData(productId).finally(() => completePendingTask());
        }
      }
    });

    this.calculateAverageRating();
    this.setupVisibilityHandler();
  }

  ngOnDestroy(): void {
    this.removeFaqStructuredData();
    if (this.visibilityRefreshTimer !== null) {
      clearTimeout(this.visibilityRefreshTimer);
      this.visibilityRefreshTimer = null;
    }
    if (this.onlineRetryHandler && this.isBrowser) {
      window.removeEventListener('online', this.onlineRetryHandler);
      this.onlineRetryHandler = null;
    }
    if (this.visibilityHandler && this.isBrowser) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  /**
   * When the tab becomes visible again, lightly refresh product + cart.
   * Debounced and offline-aware: waking from sleep often drops the first request (avoid error spam).
   */
  private setupVisibilityHandler(): void {
    if (!this.isBrowser) {
      return;
    }
    this.visibilityHandler = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      if (this.visibilityRefreshTimer !== null) {
        clearTimeout(this.visibilityRefreshTimer);
      }
      this.visibilityRefreshTimer = setTimeout(() => {
        this.visibilityRefreshTimer = null;
        void this.refreshProductAfterTabFocus();
      }, 500);
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private async refreshProductAfterTabFocus(): Promise<void> {
    const productId = this.viewModel.product?.id;
    if (!productId) {
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (!this.onlineRetryHandler) {
        this.onlineRetryHandler = () => {
          window.removeEventListener('online', this.onlineRetryHandler!);
          this.onlineRetryHandler = null;
          void this.refreshProductAfterTabFocus();
        };
        window.addEventListener('online', this.onlineRetryHandler);
      }
      return;
    }
    try {
      await this.getProductById(productId, this.productLoadSeq);
      await this.getCartItemById(productId, this.productLoadSeq);
    } catch {
      /* keep existing UI; user already has rendered content */
    }
  }

  /**
   * Update meta tags for social sharing
   * Includes: image, description with variant rates/specifications
   */
  private updateMetaTags(): void {
    const product = this.viewModel.product;
    if (!product) return;

    const productName = product.name || 'Product';

    // Use the dedicated image endpoint so crawlers (WhatsApp/Facebook/Twitter) get a real file URL.
    // Base64 data-URIs are not supported by social platforms for OG images.
    // Add a cache-busting timestamp so updated product images are re-scraped.
    const shareSelectedVariant = product.variants?.find(v => v.id === product.selectedVariantId)
      || product.variants?.find(v => v.isDefaultVariant)
      || product.variants?.[0];
    const params = new URLSearchParams();
    params.set('t', String(Date.now()));
    const baseImage = product.id
      ? productShareImageUrl(product.id, { variantId: shareSelectedVariant?.id })
      : 'https://duhadryfruits.com/assets/logo.png';
    const productImage = product.id
      ? `${baseImage}${baseImage.includes('?') ? '&' : '?'}${params.toString()}`
      : baseImage;

    const productSlug = generateProductSlug(product.name || '', product.id);
    const productUrl = `https://duhadryfruits.com/dry-fruits/${productSlug}`;

    // Build OG description from plain text (Quill HTML must never reach social crawlers)
    const rawDesc =
      product.subtitle ||
      product.description ||
      'Premium dry fruits and nuts from Duha Dryfruits';
    let richDescription = htmlToPlainText(rawDesc, this.document);

    if (product.variants && product.variants.length > 0) {
      const activeVariants = product.variants.filter((v) => v.isActive !== false);
      if (activeVariants.length > 0) {
        const priceBits = activeVariants.map((variant) => {
          const sizeText = ProductUtils.getDisplayUnit(variant);
          return `${sizeText}: ₹${variant.price}`;
        });
        richDescription = truncatePlainText(
          `${richDescription}${richDescription ? ' — ' : ''}${priceBits.join(' · ')}`,
          300,
        );
      } else {
        richDescription = truncatePlainText(richDescription, 300);
      }
    } else if (product.price) {
      richDescription = truncatePlainText(
        `${richDescription}${richDescription ? ' — ' : ''}Price: ₹${product.price}`,
        300,
      );
    } else {
      richDescription = truncatePlainText(richDescription, 300);
    }

    // Get selected/default variant price for main price tag
    const selectedVariant = product.variants?.find(v => v.id === product.selectedVariantId)
      || product.variants?.find(v => v.isDefaultVariant)
      || product.variants?.[0];
    const mainPrice = selectedVariant?.price || product.price || 0;

    this.title.setTitle(`${productName} - Duha Dryfruits`);

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: `${productName} - ₹${mainPrice} - Duha Dryfruits` });
    this.meta.updateTag({ property: 'og:description', content: richDescription });
    this.meta.updateTag({ property: 'og:image', content: productImage });
    this.meta.updateTag({ property: 'og:image:secure_url', content: productImage });
    this.meta.updateTag({ property: 'og:image:type', content: 'image/webp' });
    this.meta.updateTag({ property: 'og:url', content: productUrl });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ property: 'product:price:amount', content: String(mainPrice) });
    this.meta.updateTag({ property: 'product:price:currency', content: 'INR' });

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: `${productName} - ₹${mainPrice} - Duha Dryfruits` });
    this.meta.updateTag({ name: 'twitter:description', content: richDescription });
    this.meta.updateTag({ name: 'twitter:image', content: productImage });

    // Image dimensions (required by some platforms)
    this.meta.updateTag({ property: 'og:image:width', content: '800' });
    this.meta.updateTag({ property: 'og:image:height', content: '800' });

    // Force update by removing and re-adding tags (helps with SPAs)
    this.meta.removeTag('property="og:updated_time"');
    this.meta.addTag({ property: 'og:updated_time', content: new Date().toISOString() });
  }

  toggleReviews(): void {
    this.viewModel.showReviews = !this.viewModel.showReviews;
  }

  // ==================== PRODUCT FAQ ====================

  /**
   * Load active FAQs for the product. Runs during SSR (via PendingTasks + SSR
   * transfer) so FAQ content and JSON-LD are present in the server-rendered HTML.
   */
  private async loadProductFaqs(id: number, seq: number): Promise<void> {
    try {
      const resp = await this.productService.getActiveFaqs(id);
      if (seq !== this.productLoadSeq) {
        return;
      }
      if (resp.isError) {
        this.viewModel.faqs = [];
      } else {
        this.viewModel.faqs = (resp.successData || []).sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
        );
      }
    } catch {
      this.viewModel.faqs = [];
    } finally {
      // Only inject structured data when FAQs exist; otherwise remove any stale block.
      this.injectFaqStructuredData();
    }
  }

  /** Toggle an FAQ accordion item open/closed. */
  toggleFaq(faqId: number): void {
    if (this.expandedFaqIds.has(faqId)) {
      this.expandedFaqIds.delete(faqId);
    } else {
      this.expandedFaqIds.add(faqId);
    }
  }

  isFaqExpanded(faqId: number): boolean {
    return this.expandedFaqIds.has(faqId);
  }

  /** Strip HTML tags so JSON-LD answer text is plain text (schema.org requirement). */
  private toPlainText(html: string): string {
    return htmlToPlainText(html, this.document);
  }

  /**
   * Inject (or remove) the FAQPage JSON-LD structured data into <head>.
   * Uses the DOCUMENT token so it works during SSR (server DOM) — Google reads
   * the server-rendered markup, making the product eligible for rich results.
   */
  private injectFaqStructuredData(): void {
    const head = this.document?.head;
    if (!head) return;

    // Always clear the previous block first (product navigation reuses this component).
    const existing = this.document.getElementById(this.faqJsonLdId);
    if (existing) {
      existing.remove();
    }

    const faqs = this.viewModel.faqs || [];
    if (faqs.length === 0) {
      return; // Only inject when FAQs exist.
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: this.toPlainText(faq.question),
        acceptedAnswer: {
          '@type': 'Answer',
          text: this.toPlainText(faq.answer),
        },
      })),
    };

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = this.faqJsonLdId;
    script.textContent = JSON.stringify(schema);
    head.appendChild(script);
  }

  private removeFaqStructuredData(): void {
    const existing = this.document?.getElementById(this.faqJsonLdId);
    if (existing) {
      existing.remove();
    }
  }

  calculateAverageRating(): void {
    if (this.viewModel.reviewsSM.length > 0) {
      const total = this.viewModel.reviewsSM.reduce(
        (sum, r) => sum + r.rating,
        0
      );
      this.viewModel.averageRating = total / this.viewModel.reviewsSM.length;
    } else {
      this.viewModel.averageRating = 0;
    }
  }

  showReviewModal = false;
  openAddReviewModal(): void {
    this.showReviewModal = true;
  }

  submitReview(reviewForm: NgForm) {
    if (!reviewForm.invalid) {
      this.showReviewModal = false;
      this.viewModel.reviewFormData = reviewForm.value;
      this.viewModel.reviewFormData.rating = this.rating;
      this.viewModel.reviewFormData.productId = this.viewModel.product.id;
      this.addReview(this.viewModel.reviewFormData);
    }
  }

  async addReview(form: ReviewSM) {
    let resp = await this.reviewService.addReview(form);
    if (resp.isError) {
      await this._exceptionHandler.logObject(resp.errorData);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: resp.errorData.displayMessage,
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } else {
      await this.getProductReviews(this.viewModel.product.id, this.productLoadSeq);
    }
  }

  closeModal() {
    this.showReviewModal = false;
  }

  toggleRichDesc() {
    this.viewModel.showFullRichDesc = !this.viewModel.showFullRichDesc;
  }

  /** When set, overrides the gallery image with the selected variant's image. */
  variantImageOverride: string | null = null;

  /** Normalise any image entry (string | {src} | {imageUrl}) → browser src. */
  private imgSrc(img: any): string {
    if (!img) return '';
    const pid = this.viewModel.product?.id;
    if (typeof img === 'string') {
      const normalized = normalizeProductListImageUrl(img, pid);
      return resolveImageUrl(normalized ?? img);
    }
    const apiUrl = img.src || img.imageUrl;
    if (apiUrl) {
      const normalized = normalizeProductListImageUrl(apiUrl, pid);
      return resolveImageUrl(normalized ?? apiUrl);
    }
    return pid ? productShareImageUrl(pid) : '';
  }

  /**
   * All product images as flat string array (base64 or URL).
   * Images come from backend as [{id, src, ...}] objects.
   */
  get productImageSrcs(): string[] {
    const imgs: any[] = (this.viewModel.product?.images as any[]) || [];
    const srcs = imgs.map((img) => this.imgSrc(img)).filter((s) => !!s);
    return [...new Set(srcs)];
  }

  /**
   * Gallery = product images. Variant image is shown as override (not as gallery thumb)
   * so the user can always see all product images.
   */
  get galleryImages(): string[] {
    return this.productImageSrcs;
  }

  selectImage(index: number) {
    this.viewModel.selectedImageIndex = index;
    // User explicitly chose a gallery image — clear variant override.
    this.variantImageOverride = null;
  }

  /** Resolve the variant-specific image src — only when variant has its own upload(s). */
  private getVariantImage(variant: any): string | null {
    if (!variant) return null;
    const rows = variant.variantImages;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const primary = rows.find((img: any) => img.isPrimary) || rows[0];
    const src = this.imgSrc(primary);
    return src && String(src).trim() ? String(src) : null;
  }

  /**
   * Main image shown in the gallery.
   * Variant image overrides when a variant with its own image is selected.
   */
  get mainImageSrc(): string {
    if (this.variantImageOverride) {
      return this.variantImageOverride;
    }
    const imgs = this.galleryImages;
    if (imgs.length > 0) {
      return imgs[this.viewModel.selectedImageIndex] ?? imgs[0];
    }
    const pid = this.viewModel.product?.id;
    return pid ? productShareImageUrl(pid) : 'assets/logo.png';
  }

  /**
   * Sync the displayed image to the given variant's image (if any).
   * If the variant image already exists in the gallery, select that thumbnail;
   * otherwise show it via an override.
   */
  private syncImageToVariant(variant: any): void {
    const vImg = this.getVariantImage(variant);
    if (!vImg) {
      this.variantImageOverride = null;
      return;
    }
    const idx = this.galleryImages.findIndex((img) => img === vImg);
    if (idx >= 0) {
      this.viewModel.selectedImageIndex = idx;
      this.variantImageOverride = null;
    } else {
      this.variantImageOverride = vImg;
    }
  }

  rating = 0;
  ratingText = '';

  ratingMessages: any = {
    0.5: 'Very Poor 😠',
    1: 'Poor 😟',
    1.5: 'Below Average 😕',
    2: 'Not Good 😐',
    2.5: 'Average 🙂',
    3: 'Okay 🙂',
    3.5: 'Good 🙂👍',
    4: 'Very Good 😄',
    4.5: 'Excellent 😍',
    5: 'Outstanding 🤩🔥',
  };

  setRating(value: number) {
    this.rating = Math.max(0.5, Math.min(5, value));
    this.ratingText = this.ratingMessages[this.rating] || '';
  }

  /**
   * Main entry point for loading product + related data
   */
  private async loadProductData(id: number): Promise<void> {
    const seq = ++this.productLoadSeq;
    try {
      await this.getProductById(id, seq);
      if (seq !== this.productLoadSeq) {
        return;
      }
      await Promise.all([
        this.getCartItemById(id, seq),
        this.loadSimilarProductsByCategory(seq),
        this.getProductReviews(id, seq),
        this.loadProductFaqs(id, seq),
      ]);
      if (seq !== this.productLoadSeq) {
        return;
      }

      const openReview = this.activatedRoute.snapshot.queryParamMap.get('review');
      if (openReview === '1') {
        this.openAddReviewModal();
      }
    } catch (error) {
      await this._exceptionHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load product details.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }

  /**
   * Get single product by ID
   */
  private async getProductById(id: number, seq: number): Promise<void> {
    const resp = await this.productService.getProductById(id);
    if (seq !== this.productLoadSeq) {
      return;
    }
    if (resp.isError) {
      throw resp.errorData;
    }
    this.viewModel.product = resp.successData;
    this.viewModel.categoryId = this.viewModel.product.categoryId;
    
    // Reset gallery to first image whenever product loads
    this.viewModel.selectedImageIndex = 0;
    this.variantImageOverride = null;

    // Check URL for variant parameter
    const variantIdParam = this.activatedRoute.snapshot.queryParams['variant'];
    if (variantIdParam) {
      const variantId = Number(variantIdParam);
      const variant = this.viewModel.product.variants?.find(
        (v) => v.id === variantId
      );
      if (variant) {
        this.viewModel.product.selectedVariantId = variantId;
      } else {
        this.initializeSelectedVariant();
      }
    } else {
      this.initializeSelectedVariant();
    }
    
    // Update maxQty based on selected variant
    const selectedVariant = ProductUtils.getSelectedVariant(this.viewModel.product);
    if (selectedVariant) {
      this.viewModel.maxQty = selectedVariant.stock || 1;
    }

    // Show the initial selected variant's image (if it has its own picture).
    this.syncImageToVariant(selectedVariant);

    // Update meta tags for social sharing
    this.updateMetaTags();
  }

  /**
   * Initialize selected variant to default variant
   */
  private initializeSelectedVariant(): void {
    ProductUtils.initializeSelectedVariant(this.viewModel.product);
    const selectedVariant = ProductUtils.getSelectedVariant(this.viewModel.product);
    if (selectedVariant) {
      this.viewModel.maxQty = selectedVariant.stock || 1;
    }
  }

  /**
   * Handle variant selection change (from ngModelChange)
   */
  onVariantIdChange(variantId: any): void {
    const id = Number(variantId);
    if (!Number.isFinite(id)) return;
    this.viewModel.product.selectedVariantId = id;
    (this.viewModel.product as any).__userSelectedVariant = true;

    // Update max quantity based on variant stock
    const selectedVariant = ProductUtils.getSelectedVariant(this.viewModel.product);
    if (selectedVariant) {
      this.viewModel.maxQty = selectedVariant.stock || 1;
      if (this.viewModel.product.cartQuantity > this.viewModel.maxQty) {
        this.viewModel.product.cartQuantity = this.viewModel.maxQty;
      }
    }

    // Show the picture that belongs to the selected variant.
    this.syncImageToVariant(selectedVariant);
  }

  /**
   * Get selected variant using utility
   */
  get selectedVariant(): any {
    return ProductUtils.getSelectedVariant(this.viewModel.product);
  }

  /**
   * Get available variants for dropdown
   */
  get availableVariants(): any[] {
    return this.viewModel.product?.variants || [];
  }

  private async getProductReviews(id: number, seq: number): Promise<void> {
    const resp = await this.productService.getProductReviews(id);
    if (seq !== this.productLoadSeq) {
      return;
    }
    if (resp.isError) {
      this._commonService.ShowToastAtTopEnd(
        resp.errorData.displayMessage,
        'error'
      );
      return;
    }
    this.viewModel.reviewsSM = (resp.successData ?? []).filter((x) => x.isApproved);
    this.calculateAverageRating();
  }

  getFullStars(): number {
    return Math.floor(this.viewModel.averageRating);
  }

  hasHalfStar(): boolean {
    return this.viewModel.averageRating % 1 >= 0.5;
  }

  /**
   * Sync cart info with current product
   */
  private async getCartItemById(id: number, seq?: number): Promise<void> {
    const items = await this.cartService.getAll();
    if (seq != null && seq !== this.productLoadSeq) {
      return;
    }
    const found = this.viewModel.product.selectedVariantId
      ? items.find(
          (item) =>
            item.id === id &&
            item.selectedVariantId === this.viewModel.product.selectedVariantId
        )
      : items.find((item) => item.id === id);

    if (found) {
      this.viewModel.product.cartQuantity = found.cartQuantity;
    } else {
      this.viewModel.product.cartQuantity = 1;
    }
  }

  /**
   * Load related products by category
   */
  private async loadSimilarProductsByCategory(seq: number): Promise<void> {
    try {
      this.viewModel.pagination.PageSize = 4;
      const resp = await this.productService.getAllProductsByCategoryId(
        this.viewModel
      );

      if (seq !== this.productLoadSeq) {
        return;
      }

      if (resp.isError) {
        await this.logHandlerService.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }

      const list = resp.successData ?? [];
      this.viewModel.products = [...list];
      this.viewModel.filteredProducts = [...list];
      await this.TotalProductCountByCategoryId(seq);
    } catch (error) {
      await this.logHandlerService.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load similar products.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }

  /**
   * Get total product count by category
   */
  private async TotalProductCountByCategoryId(seq?: number): Promise<void> {
    try {
      const resp = await this.productService.getTotatProductCountByCategoryId(
        this.viewModel.product.categoryId
      );

      if (seq != null && seq !== this.productLoadSeq) {
        return;
      }

      if (resp.isError) {
        await this.logHandlerService.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }

      this.viewModel.pagination.totalCount = resp.successData.intResponse;
    } catch (error) {
      await this.logHandlerService.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load product count.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }

  /**
   * Cart Methods
   */
  increment(item: ProductSM): void {
    if (item.cartQuantity < this.viewModel.maxQty) {
      item.cartQuantity++;
      this.saveCart();
    }
  }

  decrement(item: ProductSM): void {
    if (item.cartQuantity > 1) {
      item.cartQuantity--;
      this.saveCart();
    }
  }

  async onAddToCart(product: ProductSM): Promise<void> {
    await this.cartService.toggleCart(product);
  }

  private async saveCart(): Promise<void> {
    for (const item of this.viewModel.cartItems) {
      await this.cartService.updateCartItem(item.id, item.cartQuantity);
    }
    await this.getCartItems();
  }

  private async getCartItems(): Promise<void> {
    this.viewModel.cartItems = await this.cartService.getAll();
  }

  removeItem(item: ProductSM): void {
    this.cartService.removeById(item.id);
    this.getCartItems();
  }

  buyNow(): void {
    if (!this.viewModel.product) return;
    this.cartService.toggleCart(this.viewModel.product);
    this.router.navigate(['/checkout']);
  }

  /**
   * Handle wishlist event from product card.
   * Note: The ProductCardComponent already toggles the wishlist internally.
   */
  onWishlistChanged(product: ProductSM): void {
    console.log('[SingleProduct] Wishlist changed for:', product.name, '- isWishlisted:', product.isWishlisted);
  }

  openProduct(product: ProductSM): void {
    // Don't show loader here - the target component will handle its own loader.
    // Scroll-to-top is handled centrally in the root App component on
    // NavigationEnd, so we don't scroll here to avoid competing animations.
    const productSlug = generateProductSlug(product.name, product.id);
    this.router.navigate(['/dry-fruits', productSlug]);
  }

  /**
   * Share product with variant info (plain text — never raw Quill HTML).
   */
  shareProduct(): void {
    if (!this.isBrowser || !this.viewModel.product) {
      return;
    }

    const product = this.viewModel.product;
    const productSlug = generateProductSlug(product.name, product.id);
    let shareUrl = `${window.location.origin}/dry-fruits/${productSlug}`;
    if (product.selectedVariantId) {
      shareUrl += `?variant=${product.selectedVariantId}`;
    }

    const variant = ProductUtils.getSelectedVariant(product);
    const currency = product.currency || 'INR';
    const headline = variant
      ? `${product.name} - ${ProductUtils.getVariantPrimarySizeLabel(variant)} - ${currency}${ProductUtils.getPrice(product)}`
      : `${product.name}`;

    const plainDesc = truncatePlainText(
      htmlToPlainText(product.description || product.subtitle || '', this.document),
      220,
    );

    const shareText = plainDesc ? `${headline}\n\n${plainDesc}` : headline;
    const shareData = {
      title: product.name || 'Duha Dryfruits',
      text: shareText,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share(shareData).catch(() => {
        this._commonService.ShowToastAtTopEnd('Error sharing', 'error');
      });
    } else {
      const clipboardText = `${shareText}\n${shareUrl}`;
      navigator.clipboard?.writeText(clipboardText);
      this._commonService.ShowToastAtTopEnd('Link copied to clipboard', 'success');
    }
  }

  /**
   * Placeholder for sorting
   */
  sortData(): void {
    throw new Error('Method not implemented.');
  }
}
