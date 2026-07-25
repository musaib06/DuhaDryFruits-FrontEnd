import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, PLATFORM_ID, Inject, PendingTasks, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BlogService } from '../../../../../../services/blog.service';
import { TabResumeService } from '../../../../../../services/tab-resume.service';
import { BlogDetailViewModel } from '../../../../../../models/view/end-user/blog.viewmodel';
import { environment } from '../../../../../../../environments/environment';
import { resolveBlogFeatureImage } from '../../../../../../utils/image-url.util';

/**
 * Blog Detail Page Component
 * Displays a single blog post with SEO, reading progress, and related content
 */
@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-detail.html',
  styleUrls: ['./blog-detail.scss']
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  @ViewChild('articleContent') articleContent!: ElementRef;

  /** Which share destinations are enabled (see environment.blogShare). */
  readonly shareUi = {
    facebook: environment.blogShare?.facebook !== false,
    twitter: environment.blogShare?.twitter !== false,
    linkedin: environment.blogShare?.linkedin !== false,
    whatsapp:
      String(environment.blogShare?.whatsAppNumber ?? '')
        .replace(/\D/g, '')
        .length > 0,
  };

  viewModel: BlogDetailViewModel = new BlogDetailViewModel();
  private readonly pendingTasks = inject(PendingTasks);
  private scrollListener?: () => void;
  private isBrowser: boolean;
  private tabResumeTeardown: (() => void) | null = null;

  private normalizeLoadedBlogContent(): void {
    if (!this.viewModel.blog) return;
    const raw = this.viewModel.blog.contentHtml || this.viewModel.blog.content || '';
    const normalized = this.normalizeBlogContent(raw);
    this.viewModel.blog.contentHtml = normalized;
  }

  /**
   * Remove unwanted hard line breaks that split words (e.g. "u" + "ric"),
   * while keeping paragraph structure and intentional blank lines.
   */
  private normalizeBlogContent(content: string): string {
    if (!content) return '';

    let normalized = content;

    // Convert accidental <br> inserted in the middle of words to spaces.
    normalized = normalized.replace(
      /([A-Za-z0-9])\s*<br\s*\/?>\s*([A-Za-z0-9])/g,
      '$1 $2'
    );

    // Convert accidental single newlines inside words/sentences to spaces.
    normalized = normalized.replace(
      /([A-Za-z0-9])\s*(?:\r\n|\r|\n)\s*([A-Za-z0-9])/g,
      '$1 $2'
    );

    // Collapse runs of consecutive <br> tags (double/triple enter) into one.
    normalized = normalized.replace(/(?:\s*<br\s*\/?>\s*){2,}/gi, '<br>');

    // Remove empty paragraphs/divs that only contain whitespace or a <br>
    // (the classic Quill "extra blank line" that renders as a large gap).
    normalized = normalized
      .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
      .replace(/<div>(?:\s|&nbsp;|<br\s*\/?>)*<\/div>/gi, '');

    // Drop leading/trailing <br> left at the very start/end of the content.
    normalized = normalized
      .replace(/^(?:\s*<br\s*\/?>\s*)+/i, '')
      .replace(/(?:\s*<br\s*\/?>\s*)+$/i, '')
      .trim();

    return normalized;
  }

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private tabResume: TabResumeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    // Admin "View" opens ?preview=<blogId> to render posts of any status
    // (draft/scheduled) via the authenticated admin endpoint.
    const previewId = Number(this.route.snapshot.queryParamMap.get('preview'));
    if (!slug && !Number.isFinite(previewId)) {
      this.viewModel.error = 'Invalid blog URL';
      this.tabResumeTeardown = this.tabResume.subscribe(() => void this.reloadBlogDetailAfterTabVisible());
      return;
    }

    const completePendingTask = this.pendingTasks.add();
    try {
      if (Number.isFinite(previewId) && previewId > 0) {
        await this.blogService.loadBlogByIdForPreview(previewId, this.viewModel);
      } else {
        await this.blogService.loadBlogBySlug(slug!, this.viewModel);
      }
      if (this.viewModel.blog) {
        this.normalizeLoadedBlogContent();
        this.viewModel.tocItems = this.blogService.extractTableOfContents(
          this.viewModel.blog.contentHtml || this.viewModel.blog.content || ''
        );
        if (this.isBrowser) {
          setTimeout(() => {
            this.extractToc();
            this.setupScrollListener();
          }, 100);
        }
      }
    } finally {
      completePendingTask();
    }

    if (this.isBrowser) {
      document.body.classList.add('duha-blog-reading');
    }

    this.tabResumeTeardown = this.tabResume.subscribe(() => void this.reloadBlogDetailAfterTabVisible());
  }

  private async reloadBlogDetailAfterTabVisible(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      return;
    }
    await this.blogService.loadBlogBySlug(slug, this.viewModel);
    if (this.viewModel.blog) {
      this.normalizeLoadedBlogContent();
    }
    if (this.viewModel.blog && this.isBrowser) {
      setTimeout(() => {
        this.extractToc();
        this.setupScrollListener();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.tabResumeTeardown?.();
    this.tabResumeTeardown = null;
    if (this.isBrowser) {
      document.body.classList.remove('duha-blog-reading');
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
      }
    }
    this.blogService.clearSEO();
  }

  /** Extract table of contents from headings */
  private extractToc(): void {
    if (this.articleContent?.nativeElement) {
      const headings = this.articleContent.nativeElement.querySelectorAll('h2, h3');
      this.viewModel.tocItems = Array.from(headings).map((heading: any, index: number) => {
        // Add IDs if missing
        if (!heading.id) {
          heading.id = `section-${index}`;
        }
        return {
          id: heading.id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.charAt(1))
        };
      });
    }
  }

  /** Setup scroll listener for reading progress */
  private setupScrollListener(): void {
    if (!this.isBrowser) return;

    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = undefined;
    }

    this.scrollListener = () => {
      this.updateReadingProgress();
    };
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  /** Update reading progress */
  @HostListener('window:scroll')
  updateReadingProgress(): void {
    if (!this.isBrowser || !this.articleContent?.nativeElement) return;
    
    const element = this.articleContent.nativeElement;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const elementTop = element.offsetTop;
    const elementHeight = element.offsetHeight;
    
    if (scrollTop < elementTop) {
      this.viewModel.readingProgress = 0;
      return;
    }
    
    const scrolled = scrollTop - elementTop;
    const totalHeight = elementHeight - window.innerHeight;
    
    if (totalHeight > 0) {
      this.viewModel.readingProgress = Math.min(100, (scrolled / totalHeight) * 100);
    } else {
      this.viewModel.readingProgress = 100;
    }
  }

  /** Scroll to section */
  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault();
    if (!this.isBrowser) return;
    
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  }

  /** Get share URL for social platforms */
  getShareUrl(platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp'): string {
    return this.blogService.getShareUrl(
      this.viewModel.blog?.slug || '',
      platform,
      this.viewModel.blog?.title
    );
  }

  /** Copy link to clipboard */
  async copyLink(): Promise<void> {
    if (!this.isBrowser) return;
    
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      console.log('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  blogImage(blog: { id?: number; featureImage?: string; featureImageUrl?: string } | null | undefined): string {
    return resolveBlogFeatureImage(blog);
  }
}
