import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { BannerSM } from '../../../../../models/service-models/app/v1/website-resource/banner-s-m';
import { resolveBannerImage } from '../../../../../utils/image-url.util';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-banner',
  imports: [CommonModule],
  templateUrl: './banner.html',
  styleUrl: './banner.scss',
})
export class Banner implements AfterViewInit, OnChanges, OnDestroy {
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}
  @Input() banners: BannerSM[] = [];

  @Input() isVisible: boolean = true;
  @ViewChild('bannerCarouselEl') bannerCarouselEl?: ElementRef<HTMLElement>;

  private carouselInstance: any = null;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.initCarousel();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['banners'] && this.isBrowser) {
      this.initCarousel();
    }
  }

  ngOnDestroy(): void {
    if (this.carouselInstance) {
      this.carouselInstance.dispose();
      this.carouselInstance = null;
    }
  }

  private initCarousel(): void {
    if (!this.isBrowser) {
      return;
    }
    setTimeout(() => {
      const el = this.bannerCarouselEl?.nativeElement;
      if (!el || typeof bootstrap === 'undefined') return;

      if (this.carouselInstance) {
        this.carouselInstance.dispose();
      }

      this.carouselInstance = new bootstrap.Carousel(el, {
        interval: 4000,
        ride: 'carousel',
        pause: 'hover',
        touch: true,
        wrap: true,
      });

      if ((this.banners?.length || 0) > 1) {
        this.carouselInstance.cycle();
      } else {
        this.carouselInstance.pause();
      }
    }, 80);
  }

  onBannerClick(banner: BannerSM, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const rawLink = banner?.link?.trim();
    if (!rawLink) return;

    if (this.isExternalLink(rawLink)) {
      if (this.isBrowser) {
        window.open(rawLink, '_self');
      }
      return;
    }

    const normalizedPath = rawLink.startsWith('/') ? rawLink : `/${rawLink}`;
    this.router.navigateByUrl(normalizedPath);
  }

  private isExternalLink(link: string): boolean {
    return /^https?:\/\//i.test(link);
  }

  bannerImageSrc(banner: BannerSM): string {
    return resolveBannerImage(banner);
  }

  /** Subtitle is optional — hide empty text and the default site tagline on hero banners. */
  showBannerSubtitle(banner: BannerSM): boolean {
    const text = (banner.description || '').trim();
    if (!text) {
      return false;
    }
    // Hide legacy / generic site taglines if they were saved as banner descriptions.
    const hide = [
      'FRESH FROM THE FARMS OF KASHMIR',
      'PREMIUM DRY FRUITS · PACKED FRESH',
      'PREMIUM DRY FRUITS - PACKED FRESH',
      "FROM KASHMIR'S SAFFRON LAND",
      'FROM KASHMIR’S SAFFRON LAND',
    ];
    return !hide.includes(text.toUpperCase());
  }
}
