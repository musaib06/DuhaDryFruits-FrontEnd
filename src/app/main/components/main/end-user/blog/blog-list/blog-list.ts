import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PendingTasks, PLATFORM_ID, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../../../../../services/blog.service';
import { TabResumeService } from '../../../../../../services/tab-resume.service';
import { BlogListViewModel } from '../../../../../../models/view/end-user/blog.viewmodel';
import { resolveBlogFeatureImage } from '../../../../../../utils/image-url.util';

/**
 * Blog Listing Page Component
 * Displays a grid of blog posts with filtering, search, and pagination
 */
@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './blog-list.html',
  styleUrls: ['./blog-list.scss']
})
export class BlogListComponent implements OnInit, OnDestroy {
  viewModel: BlogListViewModel = new BlogListViewModel();
  private readonly pendingTasks = inject(PendingTasks);
  private readonly isBrowser: boolean;
  private tabResumeTeardown: (() => void) | null = null;

  constructor(
    private blogService: BlogService,
    private tabResume: TabResumeService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit(): Promise<void> {
    const completePendingTask = this.pendingTasks.add();
    try {
      await Promise.all([
        this.loadFeaturedBlogs(),
        this.loadCategories(),
        this.loadBlogs(),
      ]);
      this.blogService.setupBlogListSEO(this.viewModel);
    } finally {
      completePendingTask();
    }
    this.tabResumeTeardown = this.tabResume.subscribe(() => void this.reloadBlogListAfterTabVisible());
  }

  ngOnDestroy(): void {
    this.tabResumeTeardown?.();
    this.tabResumeTeardown = null;
  }

  private async reloadBlogListAfterTabVisible(): Promise<void> {
    await Promise.all([
      this.loadFeaturedBlogs(),
      this.loadCategories(),
      this.loadBlogs(),
    ]);
    this.blogService.setupBlogListSEO(this.viewModel);
  }

  /** Load blog posts */
  async loadBlogs(): Promise<void> {
    await this.blogService.loadBlogs(this.viewModel);
  }

  /** Load featured blogs */
  async loadFeaturedBlogs(): Promise<void> {
    this.viewModel.featuredBlogs = await this.blogService.loadFeaturedBlogs(2);
  }

  /** Load categories for filter */
  async loadCategories(): Promise<void> {
    this.viewModel.categories = await this.blogService.loadCategories();
  }

  /** Handle search */
  onSearch(): void {
    this.viewModel.currentPage = 1;
    this.loadBlogs();
  }

  /** Handle category filter change */
  onCategoryChange(): void {
    this.viewModel.currentPage = 1;
    this.loadBlogs();
  }

  /** Set view mode (grid/list) */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewModel.viewMode = mode;
  }

  /** Navigate to page */
  async goToPage(page: number): Promise<void> {
    if (page < 1 || page > this.viewModel.totalPages) return;
    this.viewModel.currentPage = page;
    await this.loadBlogs();
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Get page numbers for pagination */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.viewModel.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.viewModel.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  /** Clear all filters */
  clearFilters(): void {
    this.viewModel.searchQuery = '';
    this.viewModel.activeFilters.category = null;
    this.viewModel.activeFilters.sortBy = 'latest';
    this.viewModel.currentPage = 1;
    this.loadBlogs();
  }

  blogImage(blog: { id?: number; featureImage?: string; featureImageUrl?: string }): string {
    return resolveBlogFeatureImage(blog);
  }
}
