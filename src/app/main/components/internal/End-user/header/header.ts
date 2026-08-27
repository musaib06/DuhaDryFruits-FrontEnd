import { CommonModule, isPlatformBrowser, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../../services/cart.service';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { ProductNameIdSM } from '../../../../../models/service-models/app/v1/product-name-id-s-m';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
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
import { StorefrontContentService, GiftHamperNav } from '../../../../../services/storefront-content.service';

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
  private routerSub: Subscription | null = null;
  private searchSubject = new Subject<string>();

  // Search state
  showSearchDropdown: boolean = false;
  searchQuery: string = '';
  searchResults: ProductSM[] = [];
  isSearching: boolean = false;

  /** Angular-controlled cart bag (avoids Bootstrap modal backdrop lock) */
  isCartOpen = false;

  /** Raise sticky header stacking so cart sits above floating menu / page chrome */
  @HostBinding('class.header--overlay-open')
  get headerOverlayOpen(): boolean {
    return this.isCartOpen;
  }

  /** All products (id + name) for Shop dropdown — from product names API */
  shopDropdownProducts: ProductNameIdSM[] = [];

  /** Health concern video titles for nav dropdown */
  healthConcernNavVideos: VideoSM[] = [];
  isOpenOffCanvasHealth = false;

  /** Show Blog / Wellness / Gift Hampers only when storefront has content */
  showBlogNav = false;
  showWellnessNav = false;
  giftHamperNav: GiftHamperNav | null = null;

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
    private storefrontContent: StorefrontContentService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    super(commonService, logHandlerService);
    this.viewModel = new HeaderViewModel();
    this.isBrowser = isPlatformBrowser(platformId);
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

    // Categories help SSR nav links; defer heavy dropdown/video/blog fetches off the critical path.
    void this.loadPageData();
    if (this.isBrowser) {
      this._commonService.stripBootstrapModalArtifacts();
      this.scheduleSecondaryNavLoads();
    }

    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.closeCartBag();
        this._commonService.stripBootstrapModalArtifacts();
      });
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
    await this.loadStorefrontNavContent();
  }

  private async loadStorefrontNavContent(): Promise<void> {
    try {
      await this.storefrontContent.ensureLoaded();
      this.showBlogNav = this.storefrontContent.showJournal;
      this.showWellnessNav = this.storefrontContent.showMedia;
      this.giftHamperNav = this.storefrontContent.giftHamper;
      this.healthConcernNavVideos = [...this.storefrontContent.videos].sort(
        (a, b) => (Number(b.id) || 0) - (Number(a.id) || 0),
      );
    } catch {
      this.showBlogNav = false;
      this.showWellnessNav = false;
      this.giftHamperNav = null;
      this.healthConcernNavVideos = [];
    }
    this.cdr.markForCheck();
  }

  isHiddenGiftHamperCategory(category: { name?: string } | null | undefined): boolean {
    return StorefrontContentService.isGiftHamperCategory(category) && !this.giftHamperNav;
  }

  private async refreshBlogNavVisibility(): Promise<void> {
    await this.loadStorefrontNavContent();
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
        const msg = String(resp.errorData?.displayMessage || '');
        const isNetwork =
          msg === 'Please check network and try again.' ||
          /network|timeout|timed out|econnaborted|etimedout/i.test(msg);
        // Don't block the whole storefront with a modal on a flaky category call.
        if (!isNetwork) {
          this._commonService.showSweetAlertToast({
            title: 'Error',
            text: resp.errorData.displayMessage,
            icon: 'error',
            confirmButtonText: 'OK',
          });
        }
      } else {
        this.viewModel.categoriesViewModel.categories = this.sortCategoriesBySequence(resp.successData || []);
        this.cdr.detectChanges();
      }
    } catch (error) {
      // Silent — nav still works via hard-coded shop links.
      console.warn('[Header] Category load failed', error);
    }
  }

  /** Shop names / videos / blog are not needed for first paint — wait for idle. */
  private scheduleSecondaryNavLoads(): void {
    const run = () => {
      void this.loadShopDropdownProducts();
      void this.loadStorefrontNavContent();
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run, { timeout: 2500 });
    } else {
      setTimeout(run, 1200);
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
    this.routerSub?.unsubscribe();
    this.closeCartBag();
    if (this.isBrowser) {
      document.body.classList.remove('duha-overlay-open');
    }
  }

  openCartBag(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    // Clear any leftover Bootstrap blur lock first
    this._commonService.stripBootstrapModalArtifacts();
    this.isCartOpen = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('duha-overlay-open');
    }
    this.cdr.detectChanges();
  }

  closeCartBag(): void {
    if (!this.isCartOpen && this.isBrowser) {
      this._commonService.stripBootstrapModalArtifacts();
      return;
    }
    this.isCartOpen = false;
    if (this.isBrowser) {
      document.body.style.removeProperty('overflow');
      document.body.classList.remove('duha-overlay-open');
      this._commonService.stripBootstrapModalArtifacts();
    }
    this.cdr.markForCheck();
  }

  /** Open wishlist reliably (avoids blank outlet when DI fails mid-routerLink). */
  goToWishlist(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.closeCartBag();
    void this.router.navigateByUrl('/saved-items');
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
      this.router.navigate(['/buy-dry-fruits'], {
        queryParams: { search: this.searchQuery.trim() },
      });
      this.closeSearch();
    }
  }

  navigateToProduct(product: ProductSM): void;
  navigateToProduct(product: ProductNameIdSM): void;
  navigateToProduct(product: ProductSM | ProductNameIdSM): void {
    const productSlug = generateProductSlug(product.name, product.id);
    this.router.navigate(['/dry-fruits', productSlug]);
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
          !!target.closest('button')?.querySelector('.ri-search-2-line') &&
          !!target.closest('.d-lg-none'));

      // Don't close if clicking on overlay (it will close via overlay click handler)
      const isOverlay = target.classList.contains('search-overlay');

      if (!isDesktopSearch && !isMobileSearch && !isOverlay) {
        this.closeSearch();
      }
    }
  }

  // Close cart / search on ESC
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isCartOpen) {
      this.closeCartBag();
      return;
    }
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
