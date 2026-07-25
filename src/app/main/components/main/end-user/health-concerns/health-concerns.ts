import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BaseComponent } from '../../../../../base.component';
import { VideoSM } from '../../../../../models/service-models/app/v1/website-resource/video-s-m';
import { VideoViewModel } from '../../../../../models/view/website-resource/video.viewmodel';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { VideoService } from '../../../../../services/video.service';
import { TabResumeService } from '../../../../../services/tab-resume.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-health-concerns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './health-concerns.html',
  styleUrl: './health-concerns.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthConcerns
  extends BaseComponent<VideoViewModel>
  implements OnInit, OnDestroy
{
  readonly pageSize = 6;
  currentPage = 1;
  totalPages = 1;
  pagedVideos: VideoSM[] = [];
  allVideos: VideoSM[] = [];
  selectedVideo: VideoSM | null = null;

  private videoModal: any = null;
  private urlSafeCache = new Map<string, SafeResourceUrl>();
  private querySub: Subscription | null = null;
  private tabResumeTeardown: (() => void) | null = null;
  private readonly isBrowser: boolean;

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private videoService: VideoService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private tabResume: TabResumeService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    super(commonService, logHandler);
    this.viewModel = new VideoViewModel();
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    void this.loadPageData(false);
    this.tabResumeTeardown = this.tabResume.subscribe(() => void this.loadPageData(true));
    if (this.isBrowser) {
      this.initModal();
    }
    this.querySub = this.route.queryParamMap.subscribe(() => {
      if (this.allVideos.length) {
        this.handleOpenVideoFromQuery();
      }
    });
  }

  ngOnDestroy(): void {
    this.tabResumeTeardown?.();
    this.tabResumeTeardown = null;
    this.querySub?.unsubscribe();
    if (this.videoModal) {
      this.videoModal.dispose();
    }
  }

  override async loadPageData(silentResume = false): Promise<void> {
    await this._commonService.presentLoading();
    try {
      const countResp = await this.videoService.getTotalVideoCount();
      const totalCount = countResp.isError
        ? 0
        : countResp.successData?.intResponse || 0;

      this.viewModel.pagination.PageNo = 1;
      this.viewModel.pagination.PageSize = Math.max(totalCount, 100);

      const resp = await this.videoService.getAllPaginatedVideo(this.viewModel);
      if (resp.isError) {
        this.allVideos = [];
        this.pagedVideos = [];
        this.totalPages = 1;
      } else {
        const list = resp.successData || [];
        this.allVideos = [...list].sort((a, b) => (b.id || 0) - (a.id || 0));
        this.totalPages = Math.max(
          1,
          Math.ceil(this.allVideos.length / this.pageSize)
        );
        this.currentPage = 1;
        this.updatePagedVideos();
        this.handleOpenVideoFromQuery();
      }
      this.cdr.detectChanges();
    } catch (error) {
      await this._exceptionHandler.logObject(error);
      if (!silentResume) {
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Failed to load health concern videos.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    } finally {
      this._commonService.dismissLoader();
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.updatePagedVideos();
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  trackByVideo(_: number, video: VideoSM): number {
    return video.id;
  }

  getVideoThumbnail(url: string): string {
    const videoId = this.extractVideoId(url);
    if (!videoId) return 'assets/logo.png';
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
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
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    const safe = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    this.urlSafeCache.set(url, safe);
    return safe;
  }

  openVideoModal(video: VideoSM): void {
    this.selectedVideo = video;
    this.cdr.detectChanges();
    setTimeout(() => this.videoModal?.show(), 50);
  }
  openProduct(productId: number): void {
    if (this.videoModal) {
      this.videoModal.hide();
    }
    this.closeVideoModal();
    this._commonService.stripBootstrapModalArtifacts();
    setTimeout(() => {
      this._commonService.stripBootstrapModalArtifacts();
      void this.router.navigate(['/dry-fruits', productId]);
    }, 0);
  }

  closeVideoModal(): void {
    this.selectedVideo = null;
    this.cdr.detectChanges();
  }

  private handleOpenVideoFromQuery(): void {
    const id = this.route.snapshot.queryParamMap.get('openVideo');
    if (!id || !this.allVideos.length) return;
    const video = this.allVideos.find((v) => String(v.id) === id);
    if (!video) return;
    setTimeout(() => {
      this.openVideoModal(video);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }, 120);
  }

  private updatePagedVideos(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedVideos = this.allVideos.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  private initModal(): void {
    if (!this.isBrowser) {
      return;
    }
    setTimeout(() => {
      const modalEl = document.getElementById('healthConcernsVideoModal');
      if (!modalEl || typeof bootstrap === 'undefined') return;
      this.videoModal = new bootstrap.Modal(modalEl, {
        backdrop: true,
        keyboard: true,
      });
      modalEl.addEventListener('hidden.bs.modal', () => this.closeVideoModal());
    }, 100);
  }

  private extractVideoId(url: string): string {
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

  // Helper method to get video duration (placeholder implementation)
  getVideoDuration(url: string): string | null {
    // This is a placeholder - in a real implementation, you might fetch this from YouTube API
    // For now, return null so the fallback value is used
    return null;
  }

  // Helper method to get category display name
  getCategoryName(category?: string): string | null {
    if (!category) return null;
    
    // Map category codes to display names
    const categoryMap: { [key: string]: string } = {
      'wellness': 'Wellness',
      'health': 'Health Tips',
      'remedies': 'Natural Remedies',
      'nutrition': 'Nutrition',
      'lifestyle': 'Lifestyle',
      'kashmir': 'Heritage Wellness'
    };
    
    return categoryMap[category.toLowerCase()] || category;
  }
}
