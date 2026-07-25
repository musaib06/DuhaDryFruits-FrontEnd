import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { BaseComponent } from '../../../../../base.component';
import { AdminProductsViewModel } from '../../../../../models/view/Admin/admin-product.viewmodel';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../../internal/End-user/product/product';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { CartService } from '../../../../../services/cart.service';
import { WishlistService } from '../../../../../services/wishlist.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../../services/product.service';
import { CategoryService } from '../../../../../services/category.service';
import { CategorySM } from '../../../../../models/service-models/app/v1/categories-s-m';
import { ProductUtils } from '../../../../../utils/product.utils';
import { generateProductSlug } from '../../../../../utils/slug.utils';
import { TabResumeService } from '../../../../../services/tab-resume.service';

import { Subject, Subscription, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-shop',
  imports: [CommonModule, FormsModule, ProductCardComponent, RouterLink],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
  standalone: true,
})
export class Shop extends BaseComponent<AdminProductsViewModel> implements OnInit, OnDestroy {
  private readonly isBrowser: boolean;

  // UI / filter state
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedCategory: number | null = null;
  inStockOnly = true;

  // pagination / sort
  pageSize = 8;
  currentPage = 1;
  totalPages = 1;
  selectedSort = 'price_asc';

  /** Friendlier shop heading (maps legacy titles). */
  get displayPageTitle(): string {
    const title = (this.viewModel?.PageTitle || '').trim();
    if (!title || title === 'All Products') return 'The Collection';
    if (title.startsWith('Search Results for ')) {
      return title.replace('Search Results for ', 'Matches for ');
    }
    return title;
  }

  // local caches
  cartItems: ProductSM[] = [];

  // rxjs
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  private tabResumeTeardown: (() => void) | null = null;
  private countRequestSeq = 0;

  // ✅ Loader guard
  private loaderCounter = 0;

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private cartService: CartService,
    private router: Router,
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private tabResume: TabResumeService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    super(commonService, logHandler);
    this.isBrowser = isPlatformBrowser(platformId);
    this.viewModel = new AdminProductsViewModel();

    this.viewModel.pagination.PageSize = this.pageSize;
    this.viewModel.pagination.PageNo = this.currentPage;
  }

  private syncPagination(): void {
    this.viewModel.pagination.PageSize = this.pageSize;
    this.viewModel.pagination.PageNo = this.currentPage;

    const userVm = this.viewModel.userProductViewModel;
    if (userVm?.pagination) {
      userVm.pagination.PageSize = this.pageSize;
      userVm.pagination.PageNo = this.currentPage;
    }
  }

  // =========================
  // ✅ Loader helpers (core fix)
  // =========================
  private async showLoader() {
    if (this.loaderCounter === 0) {
      await this._commonService.presentLoading();
    }
    this.loaderCounter++;
  }

  private async hideLoader() {
    if (this.loaderCounter > 0) {
      this.loaderCounter--;
      if (this.loaderCounter === 0) {
        await this._commonService.dismissLoader();
      }
    }
  }

  ngOnInit(): void {
    // ✅ Debounced search
    this.subscriptions.add(
      this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
        this.currentPage = 1;
        if (this.viewModel.searchstring && this.viewModel.searchstring.trim().length >= 2) {
          this.loadProductsPageDataBysearchString();
        } else {
          this.viewModel.products = [];
          this.viewModel.pagination.totalCount = 0;
          this.totalPages = 1;
          if (!this.viewModel.searchstring?.trim()) {
            this.loadProductsByCategoryOrAll();
          }
          this.cdr.detectChanges();
        }
      })
    );

    // Single subscription — avoids duplicate loads when params + queryParams change together
    this.subscriptions.add(
      combineLatest([
        this.activatedRoute.params,
        this.activatedRoute.queryParams,
      ])
        .pipe(
          map(([params, queryParams]) => ({
            categoryId: params['categoryId'] ? +params['categoryId'] : 0,
            categoryName: params['categoryName'] as string | undefined,
            search: (queryParams['search'] as string | undefined)?.trim() || '',
          })),
          distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        )
        .subscribe(({ categoryId, categoryName, search }) => {
          this.countRequestSeq++;
          this.currentPage = 1;
          this.syncPagination();

          if (categoryId && categoryName) {
            this.viewModel.userProductViewModel.categoryId = categoryId;
            this.viewModel.PageTitle = categoryName;
          } else {
            this.viewModel.PageTitle = 'The Collection';
            this.viewModel.userProductViewModel.categoryId = 0;
          }

          if (search) {
            this.viewModel.searchstring = search;
            this.viewModel.PageTitle = `Matches for "${search}"`;
            void this.loadProductsPageDataBysearchString();
            return;
          }

          this.viewModel.searchstring = '';
          if (!this.viewModel.searchstring) {
            void this.loadProductsByCategoryOrAll();
          }
        }),
    );

    this.tabResumeTeardown = this.tabResume.subscribe(() => void this.refreshShopAfterTabVisible());
  }

  ngOnDestroy(): void {
    this.tabResumeTeardown?.();
    this.tabResumeTeardown = null;
    this.subscriptions.unsubscribe();
  }

  private async refreshShopAfterTabVisible(): Promise<void> {
    this.productService.invalidateProductListMemoryCache();
    const q = (this.viewModel.searchstring || '').trim();
    if (q.length > 0) {
      await this.loadProductsPageDataBysearchString();
    } else if (this.viewModel.userProductViewModel?.categoryId) {
      await this.loadProductsPageDataByCategoryId();
    } else {
      await this.loadPageData();
    }
    this.cdr.detectChanges();
  }

  /** trackBy helpers */
  trackByProduct(_: number, item: ProductSM) {
    return item?.id ?? item?.selectedVariant?.sku ?? item?.sku ?? _;
  }
  trackByCategory(_: number, item: CategorySM) {
    return item?.id ?? _;
  }

  /** Navigation */
  openProduct(product: ProductSM) {
    const productSlug = generateProductSlug(product.name, product.id);
    this.router.navigate(['/dry-fruits', productSlug]);
  }

  /** Wishlist */
  onWishlistChanged(product: ProductSM) {
    console.log('[Shop] Wishlist changed for:', product.name, '- isWishlisted:', product.isWishlisted);
  }

  async onAddToCart(product: ProductSM) {
    product.cartQuantity = product.cartQuantity || 1;
    await this.cartService.toggleCart(product);
    await this.getCartItems();
  }

  private async getCartItems() {
    this.cartItems = await this.cartService.getAll();
  }

  /** Called when filters/sort/pagination change */
  private async loadProductsByCategoryOrAll() {
    if (this.viewModel.userProductViewModel.categoryId) {
      await this.loadProductsPageDataByCategoryId();
    } else {
      await this.loadPageData();
    }
    this.cdr.detectChanges();
  }

  /** Sorting (default: price low → high) */
  onSortChange(): void {
    if (this.viewModel.products?.length) {
      this.viewModel.products = this.sortProducts(this.viewModel.products, this.selectedSort);
    }
  }

  sortProducts(list: ProductSM[], sortKey: string | null): ProductSM[] {
    const key = sortKey || 'price_asc';
    const copy = [...list];

    copy.forEach(p => ProductUtils.initializeSelectedVariant(p));

    if (key === 'price_asc')
      copy.sort((a, b) => ProductUtils.getPrice(a) - ProductUtils.getPrice(b));
    else if (key === 'price_desc')
      copy.sort((a, b) => ProductUtils.getPrice(b) - ProductUtils.getPrice(a));
    else if (key === 'name_asc')
      copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (key === 'name_desc')
      copy.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    return copy;
  }

  /** Search handler */
  onSearchChange(_: any) {
    this.searchSubject.next(this.viewModel.searchstring);
  }

  /** Pagination */
  goToPage(page: number) {
    if (page < 1) page = 1;

    const totalCount = this.viewModel.pagination.totalCount || 0;
    this.totalPages = Math.max(1, Math.ceil(totalCount / this.pageSize));

    if (page > this.totalPages) page = this.totalPages;
    if (page === this.currentPage) return;

    this.currentPage = page;
    this.syncPagination();

    if (this.viewModel.searchstring) {
      this.loadProductsPageDataBysearchString();
    } else {
      this.loadProductsByCategoryOrAll();
    }

    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // =============================
  // ✅ API CALLS
  // =============================

  override async loadPageData() {
    await this.showLoader();
    try {
      this.syncPagination();
      this.viewModel.productFormData = this.viewModel.productFormData || ({} as any);
      (this.viewModel.productFormData as any).priceMin = this.minPrice;
      (this.viewModel.productFormData as any).priceMax = this.maxPrice;
      (this.viewModel.productFormData as any).inStockOnly = this.inStockOnly;

      const resp = await this.productService.getAllProducts(this.viewModel);

      if (resp.isError) {
        this.viewModel.products = [];
        this.viewModel.pagination.totalCount = 0;
      } else {
        this.viewModel.products = this.sortProducts(resp.successData || [], this.selectedSort);
        this.clampCurrentPageIfNeeded();
      }

      // background
      this.TotalProductCount();
    } finally {
      await this.hideLoader();
      this.cdr.detectChanges();
    }
  }

  async loadProductsPageDataByCategoryId() {
    await this.showLoader();
    try {
      this.syncPagination();
      this.viewModel.productFormData = this.viewModel.productFormData || ({} as any);
      (this.viewModel.productFormData as any).priceMin = this.minPrice;
      (this.viewModel.productFormData as any).priceMax = this.maxPrice;
      (this.viewModel.productFormData as any).inStockOnly = this.inStockOnly;

      const resp = await this.productService.getAllProductsByCategoryId(this.viewModel.userProductViewModel);

      if (resp.isError) {
        this.viewModel.products = [];
        this.viewModel.pagination.totalCount = 0;
      } else {
        this.viewModel.products = this.sortProducts(resp.successData || [], this.selectedSort);
        this.clampCurrentPageIfNeeded();
      }

      // background
      this.TotalProductByCategoryIdCount();
    } finally {
      await this.hideLoader();
      this.cdr.detectChanges();
    }
  }

  async loadProductsPageDataBysearchString() {
    const term = (this.viewModel.searchstring || '').trim();
    if (term.length < 2) {
      this.viewModel.products = [];
      this.viewModel.pagination.totalCount = 0;
      this.totalPages = 1;
      this.cdr.detectChanges();
      return;
    }
    await this.showLoader();
    try {
      this.syncPagination();
      const queryFilter = {
        skip: (this.currentPage - 1) * this.pageSize,
        top: this.pageSize,
      };
      const resp = await this.productService.getAllProductsBySearchString(
        term,
        queryFilter
      );

      if (resp.isError) {
        this.viewModel.products = [];
        this.viewModel.pagination.totalCount = 0;
      } else {
        this.viewModel.products = this.sortProducts(resp.successData || [], this.selectedSort);
        const totalFromApi = (resp as { searchTotalCount?: number }).searchTotalCount;
        if (typeof totalFromApi === 'number') {
          this.viewModel.pagination.totalCount = totalFromApi;
          this.totalPages = Math.max(1, Math.ceil(totalFromApi / this.pageSize));
        } else {
          await this.updateSearchTotalCount(term);
        }
        this.clampCurrentPageIfNeeded();
      }
    } finally {
      await this.hideLoader();
      this.cdr.detectChanges();
    }
  }

  async TotalProductCount() {
    const seq = ++this.countRequestSeq;
    const resp = await this.productService.getTotatProductCount();
    if (seq !== this.countRequestSeq) return;
    this.viewModel.pagination.totalCount = resp.isError ? 0 : resp.successData.intResponse || 0;
    this.totalPages = Math.max(1, Math.ceil(this.viewModel.pagination.totalCount / this.pageSize));
    this.clampCurrentPageIfNeeded();
  }

  async TotalProductByCategoryIdCount() {
    const seq = ++this.countRequestSeq;
    const categoryId = this.viewModel.userProductViewModel?.categoryId || 0;
    const resp = await this.productService.getTotatProductCountByCategoryId(categoryId);
    if (seq !== this.countRequestSeq) return;
    this.viewModel.pagination.totalCount = resp.isError ? 0 : resp.successData.intResponse || 0;
    this.totalPages = Math.max(1, Math.ceil(this.viewModel.pagination.totalCount / this.pageSize));
    this.clampCurrentPageIfNeeded();
  }

  private clampCurrentPageIfNeeded(): void {
    const totalCount = this.viewModel.pagination.totalCount || 0;
    this.totalPages = Math.max(1, Math.ceil(totalCount / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
      this.syncPagination();
    }
  }

  private async updateSearchTotalCount(searchTerm: string) {
    try {
      if (!searchTerm || searchTerm.length < 1) {
        this.viewModel.pagination.totalCount = 0;
        this.totalPages = 1;
        return;
      }

      const pageResults = this.viewModel.products?.length || 0;
      const offset = (this.currentPage - 1) * this.pageSize;

      if (pageResults < this.pageSize) {
        this.viewModel.pagination.totalCount = offset + pageResults;
        this.totalPages = Math.max(1, Math.ceil(this.viewModel.pagination.totalCount / this.pageSize));
        return;
      }

      const probeResp = await this.productService.getAllProductsBySearchString(searchTerm, {
        skip: 0,
        top: 200,
      });
      if (probeResp.isError) {
        this.viewModel.pagination.totalCount = offset + pageResults;
      } else {
        const probeLen = probeResp.successData?.length || 0;
        this.viewModel.pagination.totalCount =
          probeLen < 200 ? probeLen : offset + pageResults + this.pageSize;
      }
      this.totalPages = Math.max(1, Math.ceil(this.viewModel.pagination.totalCount / this.pageSize));

      if (this.currentPage > this.totalPages) {
        this.goToPage(this.totalPages);
      }
    } catch {
      // ignore count probe failures
    }
  }
}
