import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BaseComponent } from '../../../../../base.component';
import { VideoViewModel } from '../../../../../models/view/website-resource/video.viewmodel';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { VideoService } from '../../../../../services/video.service';
import { TabResumeService } from '../../../../../services/tab-resume.service';

declare var bootstrap: any;

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './videos.html',
  styleUrls: ['./videos.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Videos
  extends BaseComponent<VideoViewModel>
  implements OnInit, AfterViewInit, OnDestroy
{
  private readonly isBrowser: boolean;
  isMobile = false;
  private carousel: any = null;
  private videoModal: any = null;
  private urlSafeCache = new Map<string, SafeResourceUrl>();
  private tabResumeTeardown: (() => void) | null = null;

  groupedVideos: any[][] = [];
  currentSlide: number = 0;
  selectedVideo: any = null;
  autoScrollEnabled: boolean = true;

  readonly AUTO_SCROLL_INTERVAL = 6000;

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private sanitizer: DomSanitizer,
    private videoService: VideoService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router,
    private tabResume: TabResumeService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    super(commonService, logHandler);
    this.viewModel = new VideoViewModel();
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.isMobile = this.isBrowser && window.innerWidth <= 768;
    this.viewModel.pagination.PageNo = 1;
    this.viewModel.pagination.PageSize = 100;
    void this.loadPageData();
    this.tabResumeTeardown = this.tabResume.subscribe(() => void this.loadPageData());
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.initModal();
    }
  }

  ngOnDestroy(): void {
    this.tabResumeTeardown?.();
    this.tabResumeTeardown = null;
    if (this.carousel) {
      this.carousel.dispose();
    }
    if (this.videoModal) {
      this.videoModal.dispose();
    }
  }

  private initModal(): void {
    if (!this.isBrowser) {
      return;
    }
    setTimeout(() => {
      const modalEl = document.getElementById('videoModal');
      if (!modalEl || typeof bootstrap === 'undefined') return;

      this.videoModal = new bootstrap.Modal(modalEl, {
        backdrop: true,
        keyboard: true,
      });

      // Clean up iframe when modal is hidden
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.closeVideoModal();
      });
    }, 100);
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    if (this.urlSafeCache.has(url)) {
      return this.urlSafeCache.get(url)!;
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      const fallback = this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
      this.urlSafeCache.set(url, fallback);
      return fallback;
    }
    // Add autoplay=1 to start playing when modal opens
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    this.urlSafeCache.set(url, safeUrl);
    return safeUrl;
  }

  openVideoModal(video: any): void {
    this.selectedVideo = video;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      if (this.videoModal) {
        this.videoModal.show();
      }
    }, 50);
  }

  closeVideoModal(): void {
    this.selectedVideo = null;
    this.cdr.detectChanges();
  }

  navigateToProduct(productId: number): void {
    if (this.videoModal) {
      this.videoModal.hide();
    }
    this.closeVideoModal();
    this._commonService.stripBootstrapModalArtifacts();
    // Backdrop removal can lag one frame after hide()
    setTimeout(() => {
      this._commonService.stripBootstrapModalArtifacts();
      void this.router.navigate(['/product', productId]);
    }, 0);
  }

  getVideoThumbnail(url: string): string {
    const videoId = this.extractVideoId(url);
    if (!videoId) return 'assets/logo.png';
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  extractVideoId(url: string): string {
    if (!url) return '';
    const raw = String(url).trim();

    // Direct ID support
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

    try {
      const parsed = new URL(raw);
      const host = parsed.hostname.replace(/^www\./, '');

      if (host === 'youtu.be') {
        const id = parsed.pathname.split('/').filter(Boolean)[0] || '';
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
      }

      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        const v = parsed.searchParams.get('v');
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

        const parts = parsed.pathname.split('/').filter(Boolean);
        // Supports /shorts/:id, /embed/:id, /live/:id, /v/:id
        const idx = parts.findIndex((p) => ['shorts', 'embed', 'live', 'v'].includes(p));
        if (idx >= 0 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
          return parts[idx + 1];
        }
      }
    } catch {
      // Fall through to regex fallback
    }

    const fallbackMatch = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);
    return fallbackMatch ? fallbackMatch[1] : '';
  }

  trackByGroup(index: number): number {
    return index;
  }
  trackByVideo(index: number, video: any): string {
    return video.youtubeUrl;
  }

  override async loadPageData(): Promise<void> {
    try {
      const resp = await this.videoService.getStorefrontVideos(
        this.viewModel.pagination.PageNo,
        this.viewModel.pagination.PageSize,
      );
      if (!resp.isError) {
        this.viewModel.VideoSMList = resp.successData || [];
        this.groupedVideos = this.chunkArray(this.viewModel.VideoSMList, this.isMobile ? 1 : 2);
        this.cdr.detectChanges();
        this.initCarousel();
      }
    } catch {
      // Videos are non-critical on the homepage
    }
  }


  /**
   * Ensure the carousel initializes with the correct interval
   */
  private initCarousel(): void {
    if (!this.isBrowser) {
      return;
    }
    if (this.carousel) {
      try {
        this.carousel.dispose();
      } catch {
        /* ignore */
      }
      this.carousel = null;
    }
    setTimeout(() => {
      const carouselEl = document.getElementById('videoCarousel');
      if (!carouselEl || typeof bootstrap === 'undefined') return;

      this.carousel = new bootstrap.Carousel(carouselEl, {
        interval: this.autoScrollEnabled ? this.AUTO_SCROLL_INTERVAL : false,
        wrap: true,
        pause: 'hover',
      });

      if (this.autoScrollEnabled) {
        this.carousel.cycle();
      }

      carouselEl.addEventListener('slid.bs.carousel', (e: any) => {
        this.ngZone.run(() => {
          this.currentSlide = e.to;
          this.cdr.detectChanges();
        });
      });
    }, 500);
  }
  private chunkArray<T>(arr: T[], size: number): T[][] {
    const result = [];
    for (let i = 0; i < arr.length; i += size)
      result.push(arr.slice(i, i + size));
    return result;
  }
}
