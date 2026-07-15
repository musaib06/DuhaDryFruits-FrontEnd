import { ChangeDetectorRef, Component, inject, NgZone, OnDestroy, OnInit, PendingTasks } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { Banner } from '../../../internal/End-user/banner/banner';
import { ProductCardComponent } from '../../../internal/End-user/product/product';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { Router, RouterLink } from '@angular/router';
import { BaseComponent } from '../../../../../base.component';
import { HomeViewModel } from '../../../../../models/view/end-user/home.viewmodel';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { BannerService } from '../../../../../services/banner.service';
import { Testimonial } from '../../../internal/End-user/testimonial/testimonial';
import { ProductService } from '../../../../../services/product.service';
import { WishlistService } from '../../../../../services/wishlist.service';
import { CartService } from '../../../../../services/cart.service';
import { Videos } from '../videos/videos';
import { ReviewService } from '../../../../../services/review.service';
import { ReviewSM } from '../../../../../models/service-models/app/v1/review-s-m';
import { generateProductSlug } from '../../../../../utils/slug.utils';
import { TabResumeService } from '../../../../../services/tab-resume.service';
import { SsrTransferService } from '../../../../../services/ssr-transfer.service';
import { SSR_TRANSFER_KEYS } from '../../../../../services/ssr-transfer.keys';

interface HomePageTransfer {
  banners: unknown[];
  newArrivals: ProductSM[];
  products: ProductSM[];
}

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    Banner,
    ProductCardComponent,
    Testimonial,
    Videos
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home extends BaseComponent<HomeViewModel> implements OnInit, OnDestroy {
  showReviewModal = false;
  selectedProductForReview: ProductSM | null = null;
  reviewRating = 0;
  reviewForm = {
    name: '',
    email: '',
    comment: '',
  };

  /** Avoid error toast spam when refetching after tab sleep (GET retry + silent refetch). */
  private suppressNetworkErrorToasts = false;
  private tabResumeTeardown: (() => void) | null = null;
  private readonly pendingTasks = inject(PendingTasks);
  private readonly ssrTransfer = inject(SsrTransferService);

  constructor(
    commonService: CommonService,
    logHandlerService: LogHandlerService,
    private router: Router,
    private bannerService: BannerService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
    private reviewService: ReviewService,
    private tabResume: TabResumeService,
    private ngZone: NgZone,
    private meta: Meta,
    private title: Title,
  ) {
    super(commonService, logHandlerService);
    this.viewModel = new HomeViewModel();
  }

  async ngOnInit() {
   this.updateHomeMetaTags();
   const completePendingTask = this.pendingTasks.add();
   try {
     if (!this.hydrateHomeFromTransfer()) {
       await Promise.all([
         this.loadBanners(),
         this.loadBestSellers(),
         this.loadProducts(),
       ]);
       this.persistHomeForTransfer();
     }
   } finally {
     completePendingTask();
   }
   this.tabResumeTeardown = this.tabResume.subscribe(() => void this.refreshHomeAfterTabVisible());
  }

  /** Apply SSR payload on the browser so skeletons do not flash over rendered HTML. */
  private hydrateHomeFromTransfer(): boolean {
    const payload = this.ssrTransfer.consume<HomePageTransfer>(SSR_TRANSFER_KEYS.HOME_PAGE);
    if (!payload) {
      return false;
    }
    this.viewModel.banners = this.sortBannersBySequence(payload.banners);
    this.viewModel.newArrivals = [...(payload.newArrivals ?? [])];
    this.viewModel.productsViewModel.products = [...(payload.products ?? [])];
    this.isLoadingBanners = false;
    this.isLoadingBestSellers = false;
    this.isLoadingProducts = false;
    this.cdr.detectChanges();
    return true;
  }

  private persistHomeForTransfer(): void {
    if (!this.ssrTransfer.isServer()) {
      return;
    }
    this.ssrTransfer.set<HomePageTransfer>(SSR_TRANSFER_KEYS.HOME_PAGE, {
      banners: this.viewModel.banners ?? [],
      newArrivals: this.viewModel.newArrivals ?? [],
      products: this.viewModel.productsViewModel.products ?? [],
    });
  }

  /**
   * Update meta tags for homepage social sharing
   */
  private updateHomeMetaTags(): void {
    const title = 'Wild Valley Foods - Fresh From The Farms of Kashmir';
    const description = 'Premium farm produce from Kashmir. Dry fruits, saffron, grains, pulses, seeds, and herbs delivered to your doorstep.';
    const image = 'https://wildvalleyfoods.in/assets/dryfruits.webp';
    const url = 'https://wildvalleyfoods.in';

    this.title.setTitle(title);

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:secure_url', content: image });
    this.meta.updateTag({ property: 'og:image:type', content: 'image/webp' });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  ngOnDestroy(): void {
    this.tabResumeTeardown?.();
    this.tabResumeTeardown = null;
  }

  private async refreshHomeAfterTabVisible(): Promise<void> {
    const productsEmpty = !(this.viewModel.productsViewModel.products?.length ?? 0);
    const bestEmpty = !(this.viewModel.newArrivals?.length ?? 0);
    const bannersEmpty = !(this.viewModel.banners?.length ?? 0);
    if (!productsEmpty && !bestEmpty && !bannersEmpty) {
      return;
    }

    this.suppressNetworkErrorToasts = true;
    try {
      await Promise.all([
        ...(bannersEmpty ? [this.loadBanners()] : []),
        ...(bestEmpty ? [this.loadBestSellers()] : []),
        ...(productsEmpty ? [this.loadProducts()] : []),
      ]);
      this.ngZone.run(() => this.cdr.detectChanges());
    } finally {
      this.suppressNetworkErrorToasts = false;
      this.ngZone.run(() => this.cdr.detectChanges());
    }
  }

  private showHomeDataErrorToast(toast: {
    title: string;
    text: string;
    icon: 'error' | 'warning' | 'success';
    confirmButtonText: string;
  }): void {
    if (this.suppressNetworkErrorToasts) {
      return;
    }
    this._commonService.showSweetAlertToast(toast);
  }

  isLoadingBanners = !inject(SsrTransferService).has(SSR_TRANSFER_KEYS.HOME_PAGE);
  isLoadingBestSellers = !inject(SsrTransferService).has(SSR_TRANSFER_KEYS.HOME_PAGE);
  isLoadingProducts = !inject(SsrTransferService).has(SSR_TRANSFER_KEYS.HOME_PAGE);

  override async loadPageData() {
    await Promise.all([
      this.loadBanners(),
      this.loadBestSellers(),
      this.loadProducts(),
    ]);
  }

  private async loadBanners(): Promise<void> {
    this.isLoadingBanners = true;
    try {
      await this.getAllBanners();
    } finally {
      this.isLoadingBanners = false;
      this.cdr.detectChanges();
    }
  }

  private async loadBestSellers(): Promise<void> {
    this.isLoadingBestSellers = true;
    try {
      await this.getAllIsBestSelling();
    } finally {
      this.isLoadingBestSellers = false;
      this.cdr.detectChanges();
    }
  }

  private async loadProducts(): Promise<void> {
    this.isLoadingProducts = true;
    try {
      await this.getAllProducts();
    } finally {
      this.isLoadingProducts = false;
      this.cdr.detectChanges();
    }
  }

  trackById(index: number, item: ProductSM) {
    // return item.id ?? item.sku;
  }

  async onAddToCart(product: ProductSM) {
    product.cartQuantity = 1;
    await this.cartService.toggleCart(product);
  }

  /**
   * Handle wishlist event from product card.
   * Note: The ProductCardComponent already toggles the wishlist internally,
   * so we just log it here for debugging. No action needed.
   */
  onWishlistChanged(product: ProductSM) {
    console.log('[Home] Wishlist changed for:', product.name, '- isWishlisted:', product.isWishlisted);
  }

  openProduct(product: ProductSM) {
    const productSlug = generateProductSlug(product.name, product.id);
    this.router.navigate(['/product', productSlug]);
  }

  openProductReview(product: ProductSM) {
    this.selectedProductForReview = product;
    this.reviewRating = 0;
    this.reviewForm = { name: '', email: '', comment: '' };
    this.showReviewModal = true;
  }

  closeHomeReviewModal() {
    this.showReviewModal = false;
    this.selectedProductForReview = null;
  }

  setHomeReviewRating(rating: number) {
    this.reviewRating = rating;
  }

  async submitHomeReview() {
    if (!this.selectedProductForReview?.id) return;
    if (!this.reviewForm.name || !this.reviewForm.email || !this.reviewForm.comment || this.reviewRating <= 0) {
      this._commonService.showSweetAlertToast({
        title: 'Validation Error',
        text: 'Please fill name, email, rating and comment.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    const payload = new ReviewSM();
    payload.productId = this.selectedProductForReview.id;
    payload.name = this.reviewForm.name.trim();
    payload.email = this.reviewForm.email.trim().toLowerCase();
    payload.comment = this.reviewForm.comment.trim();
    payload.rating = this.reviewRating;

    const resp = await this.reviewService.addReview(payload);
    if (resp.isError) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: resp.errorData?.displayMessage || 'Failed to add review.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    this._commonService.showSweetAlertToast({
      title: 'Thank you!',
      text: 'Your review has been submitted.',
      icon: 'success',
      confirmButtonText: 'OK',
    });
    this.closeHomeReviewModal();
  }

  openHealthConcerns() {
    this.router.navigate(['/health-concerns']);
  }

  private sortBannersBySequence(banners: any[]): any[] {
    return [...(banners || [])].sort((a, b) => {
      const aSeq = Number(a?.sequence ?? 0);
      const bSeq = Number(b?.sequence ?? 0);
      if (aSeq !== bSeq) return aSeq - bSeq;
      return Number(a?.id ?? 0) - Number(b?.id ?? 0);
    });
  }

  async getAllBanners(): Promise<void> {
    try {
      let resp = await this.bannerService.getStorefrontBanners(
        this.viewModel.bannerViewModel
      );
      if (resp.isError) {
        await this._exceptionHandler.logObject(resp.errorData);
        this.showHomeDataErrorToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.banners = this.sortBannersBySequence(resp.successData || []);
      }
    } catch (error) {
      this.showHomeDataErrorToast({
        title: 'Error',
        text: 'An error occurred',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }

  async getAllProducts(): Promise<void> {
    try {
      this.viewModel.productsViewModel.pagination.PageSize=8;
      let resp = await this.productService.getAllProducts(
        this.viewModel.productsViewModel
      );
      if (resp.isError) {
        await this._exceptionHandler.logObject(resp.errorData);
        this.showHomeDataErrorToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.productsViewModel.products = [...(resp.successData ?? [])];
      }
    } catch (error) {
      this.showHomeDataErrorToast({
        title: 'Error',
        text: 'An error occurred',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } 
  }
  async getAllIsBestSelling(): Promise<void> {
    try {
      let resp = await this.productService.getAllIsBestSelling();
      if (resp.isError) {
        await this._exceptionHandler.logObject(resp.errorData);
        this.showHomeDataErrorToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.newArrivals = [...(resp.successData ?? [])];
      }
    } catch (error) {
      this.showHomeDataErrorToast({
        title: 'Error',
        text: 'An error occurred',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }
}
