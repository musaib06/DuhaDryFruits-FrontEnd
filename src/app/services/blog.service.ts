import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { BlogClient } from '../clients/blog.client';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { BlogSM } from '../models/service-models/app/v1/blog/blog-s-m';
import { BlogCategorySM } from '../models/service-models/app/v1/blog/blog-category-s-m';
import { BlogTagSM } from '../models/service-models/app/v1/blog/blog-tag-s-m';
import { BlogListViewModel, BlogDetailViewModel } from '../models/view/end-user/blog.viewmodel';
import { BlogAdminViewModel } from '../models/view/Admin/blog-admin.viewmodel';
import { BaseService } from './base.service';
import { environment } from '../../environments/environment';
import { SsrTransferService } from './ssr-transfer.service';
import { SSR_TRANSFER_KEYS } from './ssr-transfer.keys';

/**
 * Blog Service
 * Handles blog business logic and SEO management
 */
@Injectable({
  providedIn: 'root',
})
export class BlogService extends BaseService {
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly memoryCache = new Map<string, { at: number; data: any }>();
  private readonly isBrowser: boolean;

  constructor(
    private blogClient: BlogClient,
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) platformId: object,
    private ssrTransfer: SsrTransferService,
  ) {
    super();
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ==================== CACHE HELPERS ====================

  private getCached<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.at > this.CACHE_TTL_MS) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCached<T>(key: string, data: T): void {
    this.memoryCache.set(key, { at: Date.now(), data });
  }

  private clearCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Wrap a plain API object into a BlogSM instance so template getters
   * (formattedPublishDate, formattedReadTime, tagNames, …) work at runtime.
   * The API returns plain JSON, which otherwise has no class methods.
   */
  private toBlogModel(raw: any): BlogSM {
    if (!raw || raw instanceof BlogSM) return raw;
    return Object.assign(new BlogSM(), raw);
  }

  private toBlogModels(raw: any[]): BlogSM[] {
    return (raw || []).map((b) => this.toBlogModel(b));
  }

  // ==================== PUBLIC BLOG OPERATIONS ====================

  async loadBlogs(viewModel: BlogListViewModel): Promise<void> {
    viewModel.isLoading = true;
    try {
      const catKey =
        viewModel.activeFilters.category ?? 'all';
      const cacheKey = `blogs:${viewModel.currentPage}:${viewModel.pageSize}:${catKey}:${viewModel.activeFilters.sortBy}:${viewModel.searchQuery}`;
      const cached = this.getCached<ApiResponse<any>>(cacheKey);
      let response: ApiResponse<any>;
      if (cached) {
        response = cached;
      } else {
        const category =
          viewModel.activeFilters.category != null
            ? viewModel.activeFilters.category
            : undefined;
        response = await this.blogClient.GetPublicBlogs(
          viewModel.currentPage,
          viewModel.pageSize,
          category,
          undefined,
          viewModel.searchQuery
        );
        if (!response.isError) {
          this.setCached(cacheKey, response);
        }
      }
      if (!response.isError && response.successData) {
        viewModel.blogs = this.toBlogModels(response.successData.blogs || []);
        viewModel.totalCount = response.successData.pagination?.total || 0;
        viewModel.totalPages = response.successData.pagination?.totalPages || 1;
      } else {
        viewModel.error = response.errorData?.displayMessage || 'Failed to load blogs';
      }
    } finally {
      viewModel.isLoading = false;
    }
  }

  async loadFeaturedBlogs(limit: number = 5): Promise<BlogSM[]> {
    const cacheKey = `featured:${limit}`;
    const cached = this.getCached<BlogSM[]>(cacheKey);
    if (cached) return cached;
    const response = await this.blogClient.GetFeaturedBlogs(limit);
    if (!response.isError && response.successData) {
      const blogs = this.toBlogModels(response.successData);
      this.setCached(cacheKey, blogs);
      return blogs;
    }
    return [];
  }

  /**
   * Total count of published blogs (uses list API with limit 1 for a light request).
   * Cached with the same TTL as other blog reads.
   */
  async getPublicBlogCount(): Promise<number> {
    const cacheKey = 'public:blog-total-count';
    const cached = this.getCached<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    return this.ssrTransfer.hydrateOrFetch(
      SSR_TRANSFER_KEYS.BLOG_NAV_COUNT,
      async () => {
        const response = await this.blogClient.GetPublicBlogs(1, 1);
        let total = 0;
        if (!response.isError && response.successData) {
          total = Number(response.successData.pagination?.total ?? 0);
          if (total <= 0 && (response.successData.blogs?.length ?? 0) > 0) {
            total = 1;
          }
        }
        this.setCached(cacheKey, total);
        return total;
      },
      (total) => {
        this.setCached(cacheKey, total);
      },
    );
  }

  async loadCategories(): Promise<BlogCategorySM[]> {
    const cacheKey = 'categories';
    const cached = this.getCached<BlogCategorySM[]>(cacheKey);
    if (cached) return cached;
    const response = await this.blogClient.GetPublicCategories();
    if (!response.isError && response.successData) {
      this.setCached(cacheKey, response.successData);
      return response.successData;
    }
    return [];
  }

  async loadTags(): Promise<BlogTagSM[]> {
    const cacheKey = 'tags';
    const cached = this.getCached<BlogTagSM[]>(cacheKey);
    if (cached) return cached;
    const response = await this.blogClient.GetPublicTags();
    if (!response.isError && response.successData) {
      this.setCached(cacheKey, response.successData);
      return response.successData;
    }
    return [];
  }

  async loadBlogById(id: number): Promise<BlogSM | null> {
    try {
      const response = await this.blogClient.GetAdminBlogById(id);
      if (!response.isError && response.successData) {
        return response.successData;
      }
      return null;
    } catch {
      return null;
    }
  }

  async loadBlogBySlug(slug: string, viewModel: BlogDetailViewModel): Promise<void> {
    viewModel.isLoading = true;
    try {
      const response = await this.blogClient.GetPublicBlogBySlug(slug);
      if (!response.isError && response.successData) {
        const blog = this.toBlogModel(response.successData.blog);
        if (blog?.contentHtml) {
          blog.contentHtml = this.normalizeBlogContentHtml(blog.contentHtml);
        }
        viewModel.blog = blog;
        viewModel.relatedBlogs = this.toBlogModels(response.successData.relatedBlogs || []);
        this.setupBlogSEO(viewModel.blog!);
      } else {
        viewModel.error = response.errorData?.displayMessage || 'Blog not found';
      }
    } finally {
      viewModel.isLoading = false;
    }
  }

  /**
   * Admin preview: load a blog of ANY status (draft/scheduled/published) by id
   * via the authenticated admin endpoint. Used by the admin "View" action so
   * previewing unpublished posts doesn't hit the public published-only route
   * (which returns "Blog not found").
   */
  async loadBlogByIdForPreview(id: number, viewModel: BlogDetailViewModel): Promise<void> {
    viewModel.isLoading = true;
    try {
      const response = await this.blogClient.GetAdminBlogById(id);
      if (!response.isError && response.successData) {
        const blog = this.toBlogModel(response.successData);
        if (blog?.contentHtml) {
          blog.contentHtml = this.normalizeBlogContentHtml(blog.contentHtml);
        }
        viewModel.blog = blog;
        viewModel.relatedBlogs = [];
        this.setupBlogSEO(viewModel.blog!);
      } else {
        viewModel.error = response.errorData?.displayMessage || 'Blog not found';
      }
    } finally {
      viewModel.isLoading = false;
    }
  }

  /**
   * Clean CMS HTML so mobile never splits normal words across lines (comm-/on, kn-/own).
   * Removes soft hyphens, editor line-break hyphens, justify styles, and Quill justify class.
   */
  private normalizeBlogContentHtml(html: string): string {
    if (!html) {
      return html;
    }

    let out = html
      .replace(/\u00AD/g, '')
      .replace(/&shy;/gi, '')
      .replace(/\bql-align-justify\b/g, 'ql-align-left')
      // Editor/Word line-break hyphen: "comm-<br>on" → "common"
      .replace(/([a-zA-Z])-\s*<br\s*\/?>/gi, '$1<br')
      .replace(/([a-zA-Z])-\s*<\/p>\s*<p[^>]*>\s*([a-z])/gi, '$1$2')
      .replace(/([a-zA-Z])-\s*<\/div>\s*<div[^>]*>\s*([a-z])/gi, '$1$2');

    // Drop inline typography styles from pasted Word/Quill content
    out = out.replace(/\sstyle="[^"]*"/gi, '').replace(/\sstyle='[^']*'/gi, '');

    return out;
  }

  // ==================== SEO MANAGEMENT ====================

  private setupBlogSEO(blog: BlogSM): void {
    const siteUrl = 'https://duhadryfruits.com';
    const blogUrl = `${siteUrl}/journal/${blog.slug}`;
    const imageUrl = blog.ogImageUrl || blog.ogImage || blog.featureImage || `${siteUrl}/assets/logo.png`;
    const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`;

    this.title.setTitle(`${blog.seoTitle} - Blog - Duha Dryfruits`);
    this.meta.updateTag({ name: 'description', content: blog.seoDescription });
    this.meta.updateTag({ name: 'keywords', content: blog.metaKeywords || blog.tagNames });
    this.meta.updateTag({ rel: 'canonical', href: blog.canonicalUrl || blogUrl });
    this.meta.updateTag({ property: 'og:title', content: blog.ogTitle || blog.seoTitle });
    this.meta.updateTag({ property: 'og:description', content: blog.ogDescription || blog.seoDescription });
    this.meta.updateTag({ property: 'og:image', content: absoluteImageUrl });
    this.meta.updateTag({ property: 'og:url', content: blogUrl });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Duha Dryfruits' });
    this.meta.updateTag({ property: 'article:published_time', content: blog.publishDate?.toString() || '' });
    this.meta.updateTag({ property: 'article:author', content: blog.authorName || 'Duha Dryfruits' });
    this.meta.updateTag({ property: 'article:section', content: blog.category?.name || 'Blog' });
    this.meta.updateTag({ property: 'article:tag', content: blog.tagNames });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: blog.ogTitle || blog.seoTitle });
    this.meta.updateTag({ name: 'twitter:description', content: blog.ogDescription || blog.seoDescription });
    this.meta.updateTag({ name: 'twitter:image', content: absoluteImageUrl });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
  }

  setupBlogListSEO(viewModel: BlogListViewModel): void {
    this.title.setTitle(viewModel.pageTitle);
    this.meta.updateTag({ name: 'description', content: viewModel.pageDescription });
    this.meta.updateTag({ property: 'og:title', content: viewModel.pageTitle });
    this.meta.updateTag({ property: 'og:description', content: viewModel.pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://duhadryfruits.com/journal' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
  }

  clearSEO(): void {
    this.meta.removeTag("name='description'");
    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:image'");
    this.meta.removeTag("property='og:url'");
    this.meta.removeTag("name='twitter:card'");
  }

  // ==================== ADMIN OPERATIONS ====================

  /** Map API list payload whether backend uses `blogs`, `items`, or top-level array. */
  private normalizeAdminBlogList(raw: any): {
    blogs: BlogSM[];
    total: number;
    totalPages: number;
  } {
    if (!raw) {
      return { blogs: [], total: 0, totalPages: 1 };
    }
    let blogs: BlogSM[] = [];
    if (Array.isArray(raw)) {
      blogs = raw;
    } else if (Array.isArray(raw.blogs)) {
      blogs = raw.blogs;
    } else if (Array.isArray(raw.items)) {
      blogs = raw.items;
    } else if (Array.isArray(raw.data)) {
      blogs = raw.data;
    }
    const pag = raw.pagination ?? raw.meta ?? {};
    const total = Number(
      pag.total ?? pag.totalCount ?? raw.totalCount ?? raw.total ?? blogs.length
    );
    let totalPages = Number(pag.totalPages ?? pag.pages);
    if (!Number.isFinite(totalPages) || totalPages < 1) {
      const limit = Number(pag.limit ?? pag.pageSize ?? 20);
      totalPages = Math.max(1, limit > 0 ? Math.ceil((total || blogs.length) / limit) : 1);
    }
    return {
      blogs,
      total: Number.isFinite(total) ? total : blogs.length,
      totalPages: Number.isFinite(totalPages) ? totalPages : 1,
    };
  }

  async loadAdminBlogs(viewModel: BlogAdminViewModel): Promise<void> {
    viewModel.isLoading = true;
    viewModel.error = '';
    try {
      const response = await this.blogClient.GetAdminBlogs(
        viewModel.currentPage,
        viewModel.pageSize,
        viewModel.statusFilter || undefined,
        viewModel.categoryFilter != null
          ? viewModel.categoryFilter
          : undefined,
        viewModel.searchTerm
      );
      if (!response.isError && response.successData != null) {
        const norm = this.normalizeAdminBlogList(response.successData);
        viewModel.blogs = norm.blogs;
        viewModel.filteredBlogs = [...viewModel.blogs];
        viewModel.totalCount = norm.total;
        viewModel.totalPages = norm.totalPages;
      } else {
        viewModel.error = response.errorData?.displayMessage || 'Failed to load blogs';
      }
    } finally {
      viewModel.isLoading = false;
    }
  }

  private buildBlogFormData(blogData: BlogSM, mediaFiles: File[], tagIds: number[]): FormData {
    const formData = new FormData();
    formData.append('title', blogData.title || '');
    if (blogData.subtitle) formData.append('subtitle', blogData.subtitle);
    formData.append('slug', blogData.slug || '');
    if (blogData.excerpt) formData.append('excerpt', blogData.excerpt);
    formData.append('content', blogData.content || '');
    if (blogData.contentHtml) formData.append('contentHtml', blogData.contentHtml);
    const status =
      typeof blogData.status === 'string'
        ? String(blogData.status).toLowerCase()
        : 'draft';
    formData.append('status', status);
    formData.append(
      'categoryId',
      blogData.categoryId != null && blogData.categoryId !== undefined
        ? String(blogData.categoryId)
        : ''
    );
    formData.append('isFeatured', blogData.isFeatured ? 'true' : 'false');
    if (blogData.metaTitle) formData.append('metaTitle', blogData.metaTitle);
    if (blogData.metaDescription) formData.append('metaDescription', blogData.metaDescription);
    if (blogData.metaKeywords) formData.append('metaKeywords', blogData.metaKeywords);
    if (blogData.ogImageUrl) formData.append('ogImageUrl', blogData.ogImageUrl);
    formData.append('socialVideoYoutubeUrl', (blogData.socialVideoYoutubeUrl || '').trim());
    formData.append('socialVideoInstagramUrl', (blogData.socialVideoInstagramUrl || '').trim());
    formData.append('socialVideoFacebookUrl', (blogData.socialVideoFacebookUrl || '').trim());
    formData.append('tagIdsJson', JSON.stringify(tagIds ?? []));
    if (mediaFiles.length > 0) {
      formData.append('featureImage', mediaFiles[0]);
      for (let i = 1; i < mediaFiles.length; i++) {
        formData.append('media', mediaFiles[i]);
      }
    }
    return formData;
  }

  async createBlog(blogData: BlogSM, mediaFiles: File[], tagIds: number[]): Promise<boolean> {
    try {
      const formData = this.buildBlogFormData(blogData, mediaFiles, tagIds);
      const response = await this.blogClient.CreateBlog(formData);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async updateBlog(blogData: BlogSM, mediaFiles: File[], tagIds: number[]): Promise<boolean> {
    if (!blogData.id) return false;
    try {
      const formData = this.buildBlogFormData(blogData, mediaFiles, tagIds);
      const response = await this.blogClient.UpdateBlog(blogData.id, formData);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async deleteBlog(id: number): Promise<boolean> {
    try {
      const response = await this.blogClient.DeleteBlog(id);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async deleteBlogMedia(id: number): Promise<boolean> {
    try {
      const response = await this.blogClient.DeleteMedia(id);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ==================== CATEGORY OPERATIONS ====================

  async createCategory(categoryData: { name: string; slug: string; color: string }): Promise<boolean> {
    try {
      const response = await this.blogClient.CreateCategory(categoryData);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async updateCategory(id: number, categoryData: { name: string; slug: string; color: string }): Promise<boolean> {
    try {
      const response = await this.blogClient.UpdateCategory(id, categoryData);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const response = await this.blogClient.DeleteCategory(id);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ==================== TAG OPERATIONS ====================

  async createTag(tagData: { name: string; slug: string; color: string }): Promise<boolean> {
    try {
      const response = await this.blogClient.CreateTag(tagData);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async updateTag(id: number, tagData: { name: string; slug: string; color: string }): Promise<boolean> {
    try {
      const response = await this.blogClient.UpdateTag(id, tagData);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async deleteTag(id: number): Promise<boolean> {
    try {
      const response = await this.blogClient.DeleteTag(id);
      if (!response.isError) {
        this.clearCache();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ==================== UTILITY METHODS ====================

  calculateReadingProgress(element: HTMLElement): number {
    if (!this.isBrowser || !element) return 0;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = element.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 100;
    return Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
  }

  extractTableOfContents(htmlContent: string): Array<{ id: string; text: string; level: number }> {
    if (!htmlContent) return [];
    if (typeof DOMParser === 'undefined') {
      return [];
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(headings).map((heading, index) => ({
      id: heading.id || `heading-${index}`,
      text: heading.textContent || '',
      level: parseInt(heading.tagName.charAt(1))
    }));
  }

  getShareUrl(
    slug: string,
    platform?: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp',
    articleTitle?: string
  ): string {
    const baseUrl = `https://duhadryfruits.com/journal/${slug}`;
    const encodedUrl = encodeURIComponent(baseUrl);
    const waDigits = String(environment.blogShare?.whatsAppNumber ?? '').replace(/\D/g, '');
    const waMessage =
      articleTitle?.trim()
        ? encodeURIComponent(`${articleTitle.trim()}\n${baseUrl}`)
        : encodeURIComponent(baseUrl);

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case 'whatsapp':
        if (waDigits.length > 0) {
          return `https://wa.me/${waDigits}?text=${waMessage}`;
        }
        return `https://wa.me/?text=${waMessage}`;
      default:
        return baseUrl;
    }
  }
}
