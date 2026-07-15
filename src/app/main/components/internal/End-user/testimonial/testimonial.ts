import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { TestimonialService } from '../../../../../services/testimonial.service';
import { TestimonialSM } from '../../../../../models/service-models/app/v1/website-resource/testimonial-s-m';
import { TestimonialViewModel } from '../../../../../models/view/website-resource/testimonial.viewmodel';
import { CommonService } from '../../../../../services/common.service';
import { BaseComponent } from '../../../../../base.component';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { SsrTransferService } from '../../../../../services/ssr-transfer.service';
import { SSR_TRANSFER_KEYS } from '../../../../../services/ssr-transfer.keys';
import { ApiResponse } from '../../../../../models/service-models/foundation/api-contracts/base/api-response';

declare var bootstrap: any;

@Component({
  selector: 'app-testimonial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial.html',
  styleUrl: './testimonial.scss',
})
export class Testimonial extends BaseComponent<TestimonialViewModel> implements OnInit {
  testimonials: TestimonialSM[] = [];
  groupedTestimonials: TestimonialSM[][] = [];

  loading = false;
  error = '';
  currentSlide = 0;
  isMobile = false;
  private readonly isBrowser: boolean;
  private readonly ssrTransfer = inject(SsrTransferService);
  
  private carousel: any = null;
  private autoSlideInterval: any = null;
  readonly AUTO_SLIDE_DELAY = 5000;

  constructor(
    private commonService: CommonService,
    private loghandler: LogHandlerService,
    private testimonialService: TestimonialService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    super(commonService, loghandler);
    this.viewModel = new TestimonialViewModel();
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.isMobile = this.isBrowser && window.innerWidth <= 768;
    if (!this.hydrateFromTransfer()) {
      this.loadTestimonials();
    } else {
      setTimeout(() => this.initCarousel(), 100);
    }
  }

  private hydrateFromTransfer(): boolean {
    const resp = this.ssrTransfer.consume<ApiResponse<TestimonialSM[]>>(
      SSR_TRANSFER_KEYS.STOREFRONT_TESTIMONIALS,
    );
    if (!resp || resp.isError) {
      return false;
    }
    this.testimonials = resp.successData || [];
    this.groupedTestimonials = this.chunkArray(this.testimonials, this.isMobile ? 1 : 2);
    this.loading = false;
    this.cdr.detectChanges();
    return true;
  }
  async loadTestimonials(): Promise<void> {
    try {
      if (!this.testimonials.length) {
        this.loading = true;
      }
      this.error = '';
      this.viewModel.pagination.PageNo = 1;
      this.viewModel.pagination.PageSize = 20;

      const resp = await this.testimonialService.getStorefrontTestimonials(this.viewModel);
      if(resp.isError){
       await this._exceptionHandler.logObject(resp.errorData);
        this.error = resp.errorData.displayMessage || 'Failed to load testimonials';
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.testimonials = resp.successData || [];
        this.groupedTestimonials = this.chunkArray(this.testimonials, this.isMobile ? 1 : 2);      
        this.cdr.detectChanges();
        setTimeout(() => this.initCarousel(), 100);
      }
    } catch (err) {
      this.error = 'Failed to load testimonials';
      console.error('[Testimonial] Exception:', err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Initialize Bootstrap carousel
   */
  private initCarousel(): void {
    if (!this.isBrowser) {
      return;
    }
    const carouselEl = document.getElementById('testimonialCarousel');
    if (!carouselEl || typeof bootstrap === 'undefined') return;

    // Dispose existing carousel
    if (this.carousel) {
      try {
        this.carousel.dispose();
      } catch (e) {}
    }

    this.carousel = new bootstrap.Carousel(carouselEl, {
      interval: false,
      wrap: true,
      touch: true
    });

    // Listen for slide change
    carouselEl.addEventListener('slid.bs.carousel', (event: any) => {
      this.currentSlide = event.to;
      this.cdr.detectChanges();
    });

    // Start auto-slide
    this.startAutoSlide();
  }

  /**
   * Start auto-sliding
   */
  private startAutoSlide(): void {
    this.clearAutoSlide();
    
    this.autoSlideInterval = setInterval(() => {
      if (this.carousel && this.groupedTestimonials.length > 1) {
        this.carousel.next();
      }
    }, this.AUTO_SLIDE_DELAY);
  }

  /**
   * Clear auto-slide interval
   */
  private clearAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  /**
   * Manual navigation - reset auto-slide timer
   */
  onManualNavigation(): void {
    this.startAutoSlide();
  }

  /**
   * Chunk array into groups
   */
  private chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  /**
   * Get star array for rating display
   */
  getStars(rating: number | undefined): { filled: boolean }[] {
    const ratingValue = rating || 5;
    return Array(5).fill(null).map((_, i) => ({
      filled: i < ratingValue
    }));
  }

  /**
   * Get initials from name for avatar
   */
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Get avatar background color based on name
   */
  getAvatarColor(name: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
    ];
    
    if (!name) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Track by function for ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }

  trackByTestimonial(index: number, testimonial: TestimonialSM): number {
    return testimonial.id || index;
  }
}
