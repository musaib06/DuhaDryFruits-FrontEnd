import { CommonModule, isPlatformBrowser, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../../services/cart.service';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { ProductNameIdSM } from '../../../../../models/service-models/app/v1/product-name-id-s-m';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { WishlistService } from '../../../../../services/wishlist.service';
import { HeaderViewModel } from '../../../../../models/view/end-user/header.viewmodel';
import { BaseComponent } from '../../../../../base.component';
import { CategoryService } from '../../../../../services/category.service';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { ProductService } from '../../../../../services/product.service';
import { ProductUtils } from '../../../../../utils/product.utils';
import { generateProductSlug } from '../../../../../utils/slug.utils';
import { resolveProductImage } from '../../../../../utils/image-url.util';
import { VideoService } from '../../../../../services/video.service';
import { VideoSM } from '../../../../../models/service-models/app/v1/website-resource/video-s-m';
import { BlogService } from '../../../../../services/blog.service';
import { QueryFilter } from '../../../../../models/service-models/foundation/api-contracts/query-filter';
import { PushNotificationService } from '../../../../../notification/services/push-notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header
  extends BaseComponent<HeaderViewModel>
  implements OnInit, OnDestroy
{
  private cartSub: Subscription | null = null;
  private wishlistSub: Subscription | null = null;
  private searchSub: Subscription | null = null;
  private searchSubject = new Subject<string>();

  // Search state
  showSearchDropdown: boolean = false;
  searchQuery: string = '';
  searchResults: ProductSM[] = [];
  isSearching: boolean = false;

  /** All products (id + name) for Shop dropdown — from GET /product/names */
  shopDropdownProducts: ProductNameIdSM[] = [];

  /** Health concern video titles for nav dropdown */
  healthConcernNavVideos: VideoSM[] = [];
  isOpenOffCanvasHealth = false;

  /** Show Blog link when at least one published post exists */
  showBlogNav = false;

  // Expose utils to template
  utils = ProductUtils;
  isOpenOffCanvasCategories: boolean = false;
  private readonly isBrowser: boolean;

  @ViewChild('searchInput', { static: false })
  searchInput?: ElementRef<HTMLInputElement>;

  @ViewChild('mobileSearchInput', { static: false })
  mobileSearchInput?: ElementRef<HTMLInputElement>;

  constructor(
    commonService: CommonService,
    logHandlerService: LogHandlerService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
    private router: Router,
    private videoService: VideoService,
    private blogService: BlogService,
    private pushService: PushNotificationService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    super(commonService, logHandlerService);
    this.viewModel = new HeaderViewModel();
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /** true once the visitor has allowed notifications (hides the bell). */
  get notificationsEnabled(): boolean {
    return this.pushService.isPermissionGranted();
  }

  /** Show the bell only when notifications are supported and not yet granted. */
  get showNotificationBell(): boolean {
    return this.isBrowser && this.pushService.isSupported() && !this.pushService.isPermissionGranted();
  }

  /**
   * Explicitly ask for notification permission from a user tap. This is the
   * most reliable way to surface the browser prompt (auto prompts are often
   * suppressed). Registers the device token with the backend on success.
   */
  async enableNotifications(): Promise<void> {
    try {
      const token = await this.pushService.requestPermissionAndRegister();
      if (token) {
        this._commonService?.showSweetAlertToast?.({
          title: 'Notifications enabled',
          text: "You'll now receive updates and offers.",
          icon: 'success',
          confirmButtonText: 'OK',
        });
      } else if (this.pushService.isPermissionDenied()) {
        this._commonService?.showSweetAlertToast?.({
          title: 'Notifications blocked',
          text: 'Please allow notifications in your browser settings to subscribe.',
          icon: 'info',
          confirmButtonText: 'OK',
        });
      }
    } catch {
      /* non-fatal */
    } finally {
      this.cdr.detectChanges();
    }
  }

  ngOnInit(): void {
    // Subscribe to cart changes
    this.cartSub = this.cartService.cart$.subscribe((items) => {
      console.log('[Header] Cart updated:', items?.length, 'items');
      this.viewModel.cartItems = items || [];
      this.viewModel.subTotal = this.viewModel.cartItems.reduce((sum, item) => {
        const price = ProductUtils.getPrice(item);
        return sum + price * (item.cartQuantity || 1);
      }, 0);
      this.cdr.detectChanges();
    });

    // Subscribe to wishlist changes
    this.wishlistSub = this.wishlistService.wishlist$.subscribe((items) => {
      console.log('[Header] Wishlist updated:', items?.length, 'items');
      this.viewModel.wishListItems = items || [];
      this.cdr.detectChanges();
    });

    // Setup debounced search
    this.searchSub = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query) => {
        this.performSearch(query);
      });

    this.loadPageData();
    this.loadShopDropdownProducts();
    this.loadHealthConcernNavVideos();
    void this.refreshBlogNavVisibility();
  }
  toggleCategories() {
    this.isOpenOffCanvasCategories = !this.isOpenOffCanvasCategories;
    this.cdr.detectChanges();
  }

  toggleHealthOffcanvas(): void {
    this.isOpenOffCanvasHealth = !this.isOpenOffCanvasHealth;
    this.cdr.detectChanges();
  }

  async loadHealthConcernNavVideos(): Promise<void> {
    try {
      const resp = await this.videoService.getStorefrontVideos(1, 100);
      if (!resp.isError && resp.successData?.length) {
        this.healthConcernNavVideos = [...resp.successData].sort(
          (a, b) => (Number(b.id) || 0) - (Number(a.id) || 0)
        );
      } else {
        this.healthConcernNavVideos = [];
      }
    } catch {
      this.healthConcernNavVideos = [];
    }
    this.cdr.markForCheck();
  }

  private async refreshBlogNavVisibility(): Promise<void> {
    try {
      const n = await this.blogService.getPublicBlogCount();
      this.showBlogNav = n > 0;
    } catch {
      this.showBlogNav = false;
    }
    this.cdr.markForCheck();
  }

  private sortCategoriesBySequence(categories: any[]): any[] {
    return [...(categories || [])].sort((a, b) => {
      const aSeq = Number(a?.sequence ?? 0);
      const bSeq = Number(b?.sequence ?? 0);
      if (aSeq !== bSeq) return aSeq - bSeq;
      return String(a?.name || '').localeCompare(String(b?.name || ''));
    });
  }
onDesktopMenuClick(event: MouseEvent): void {
  if (!this.isBrowser) {
    return;
  }
  if (window.innerWidth < 992) return;

  const target = event.target as HTMLElement;

  // ✅ Ignore clicks inside search UI
  const isSearchClick =
    target.closest('.search-dropdown') ||
    target.closest('.search-icon-link');

  if (isSearchClick) return;

  // Only act on anchor clicks (your original logic)
  if (!target.closest('a')) return;

  // Close other UI states
  this.showSearchDropdown = false;
  this.isOpenOffCanvasCategories = false;
  this.isOpenOffCanvasHealth = false;

  // Remove focus to prevent sticky dropdowns
  const activeElement = document.activeElement as HTMLElement | null;
  activeElement?.blur();

  this.cdr.detectChanges();
}
  // onDesktopMenuClick(event: MouseEvent): void {
  //   if (window.innerWidth < 992) return;
  //   const target = event.target as HTMLElement;
  //   if (!target.closest('a')) return;

  //   // Close transient UI states so next click works instantly.
  //   this.showSearchDropdown = false;
  //   this.isOpenOffCanvasCategories = false;

  //   // Prevent sticky focus from holding dropdown open.
  //   const activeElement = document.activeElement as HTMLElement | null;
  //   activeElement?.blur();
  //   this.cdr.detectChanges();
  // }
  // trackById(_: number, item: any) {
  //   return item.id ?? item.name;
  // }

  override async loadPageData(): Promise<void> {
    try {
      // Fetch all categories (not just the first page) so newly added
      // categories like "Combo Offers" appear in the storefront menus.
      this.viewModel.categoriesViewModel.pagination.PageNo = 1;
      this.viewModel.categoriesViewModel.pagination.PageSize = 200;
      let resp = await this.categoryService.getStorefrontCategories(200);
      if (resp.isError) {
        await this._exceptionHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.categoriesViewModel.categories = this.sortCategoriesBySequence(resp.successData || []);
        this.cdr.detectChanges();
      }
    } catch (error) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'An error occurred',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }

  async loadShopDropdownProducts(): Promise<void> {
    try {
      const resp = await this.productService.getAllProductNamesOnly();
      if (!resp.isError && resp.successData) {
        this.shopDropdownProducts = resp.successData;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('[Header] Error loading shop product names:', error);
    }
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    this.wishlistSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  // Search functionality
  toggleSearch(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (this.showSearchDropdown) {
      this.focusSearchInput();
      return;
    }
    this.showSearchDropdown = true;
    this.cdr.detectChanges();
    if (this.isBrowser) {
      setTimeout(() => this.focusSearchInput(), 50);
    }
  }

  /** Focus the visible search input (desktop vs mobile). */
  private focusSearchInput(attempt = 0): void {
    if (!this.isBrowser || attempt > 5) return;
    const isMobileViewport = window.matchMedia('(max-width: 991.98px)').matches;
    const input = isMobileViewport
      ? this.mobileSearchInput?.nativeElement
      : this.searchInput?.nativeElement;
    if (!input) {
      setTimeout(() => this.focusSearchInput(attempt + 1), 50);
      return;
    }
    input.focus({ preventScroll: true });
    const len = input.value?.length ?? 0;
    input.setSelectionRange(len, len);
  }

  closeSearch(): void {
    this.showSearchDropdown = false;
    this.searchQuery = '';
    this.searchResults = [];
    this.cdr.detectChanges();
  }

  onSearchInput(event: any): void {
    const query = event.target.value.trim();
    this.searchQuery = query;

    if (query.length >= 2) {
      this.searchSubject.next(query);
    } else {
      this.searchResults = [];
      this.isSearching = false;
    }
    this.cdr.detectChanges();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearching = false;
    this.focusSearchInput();
    this.cdr.detectChanges();
  }

  private async performSearch(query: string): Promise<void> {
    if (!query || query.length < 2) {
      this.searchResults = [];
      this.isSearching = false;
      this.cdr.detectChanges();
      return;
    }

    this.isSearching = true;
    this.cdr.detectChanges();

    try {
      const queryFilter = new QueryFilter();
      queryFilter.skip = 0;
      queryFilter.top = 20;
      const resp = await this.productService.getAllProductsBySearchString(
        query,
        queryFilter,
      );

      if (resp.isError) {
        this.searchResults = [];
      } else {
        this.searchResults = resp.successData || [];
      }
    } catch (error) {
      console.error('[Header] Search error:', error);
      this.searchResults = [];
    } finally {
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  navigateToShop(): void {
    if (this.searchQuery && this.searchQuery.trim().length >= 2) {
      this.router.navigate(['/shop'], {
        queryParams: { search: this.searchQuery.trim() },
      });
      this.closeSearch();
    }
  }

  navigateToProduct(product: ProductSM): void;
  navigateToProduct(product: ProductNameIdSM): void;
  navigateToProduct(product: ProductSM | ProductNameIdSM): void {
    const productSlug = generateProductSlug(product.name, product.id);
    this.router.navigate(['/product', productSlug]);
    this.closeSearch();
  }

  getProductPrice(product: ProductSM): number {
    return ProductUtils.getPrice(product);
  }

  getProductSlug(product: ProductSM): string;
  getProductSlug(product: ProductNameIdSM): string;
  getProductSlug(product: ProductSM | ProductNameIdSM): string {
    return generateProductSlug(product.name, product.id);
  }

  // Close search on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.showSearchDropdown) {
      // Check for desktop search dropdown
      const isDesktopSearch =
        target.closest('.search-dropdown') ||
        target.closest('.search-icon-link');
      // Check for mobile search dropdown or button
      const isMobileSearch =
        !!target.closest('.mobile-search-dropdown') ||
        !!target.closest('.mobile-icon-btn') ||
        (!!target.closest('button') &&
          !!target.closest('button')?.querySelector('.bi-search') &&
          !!target.closest('.d-lg-none'));

      // Don't close if clicking on overlay (it will close via overlay click handler)
      const isOverlay = target.classList.contains('search-overlay');

      if (!isDesktopSearch && !isMobileSearch && !isOverlay) {
        this.closeSearch();
      }
    }
  }

  // Close search on ESC key
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showSearchDropdown) {
      this.closeSearch();
    }
  }

  async cartTotal() {
    return await this.cartService.cartTotal();
  }

  async getCartItems() {
    this.viewModel.cartItems = await this.cartService.getAll();
    this.cdr.detectChanges();
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
      await this.cartService.updateCartItem(
        item.id,
        item.cartQuantity,
        item.selectedVariantId
      );
    }
    await this.getCartItems();
  }

  removeItem(item: ProductSM) {
    this.cartService.removeById(item.id, item.selectedVariantId);
    this.getCartItems();
  }

  getSelectedVariant(item: ProductSM): any {
    return ProductUtils.getSelectedVariant(item);
  }

  getItemPrice(item: ProductSM): number {
    return ProductUtils.getPrice(item);
  }

  getProductImageSrc(product: ProductSM, fallback = 'assets/logo.png'): string {
    return resolveProductImage(product, fallback);
  }

  onProductImageError(event: Event, productId?: number): void {
    this._commonService.onProductImageError(event, productId, 'assets/logo.png');
  }
}
