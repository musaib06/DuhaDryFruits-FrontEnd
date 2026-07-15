import { BaseViewModel } from '../../internal/base.viewmodel';
import { BlogSM } from '../../service-models/app/v1/blog/blog-s-m';
import { BlogCategorySM } from '../../service-models/app/v1/blog/blog-category-s-m';
import { BlogTagSM } from '../../service-models/app/v1/blog/blog-tag-s-m';

/**
 * Blog Listing Page View Model
 */
export class BlogListViewModel extends BaseViewModel {
  // Loading & Error State
  isLoading: boolean = false;
  error: string = '';

  // Blog Data
  blogs: BlogSM[] = [];
  featuredBlogs: BlogSM[] = [];

  // Categories & Tags
  categories: BlogCategorySM[] = [];
  selectedCategory: BlogCategorySM | null = null;
  selectedTags: BlogTagSM[] = [];

  // Filters & Search
  searchQuery: string = '';
  activeFilters: {
    category: number | null;
    tags?: number[];
    sortBy: 'latest' | 'popular' | 'oldest';
  } = { category: null, sortBy: 'latest' };

  // Pagination
  currentPage: number = 1;
  pageSize: number = 9;
  totalCount: number = 0;
  totalPages: number = 0;

  // UI State
  viewMode: 'grid' | 'list' = 'grid';
  showFilters: boolean = false;

  // SEO
  pageTitle: string = 'Blog - Wild Valley Foods';
  pageDescription: string = 'Discover healthy recipes, nutrition tips, and stories from Kashmir\'s finest farms.';
}

/**
 * Blog Detail Page View Model
 */
export class BlogDetailViewModel extends BaseViewModel {
  // Loading & Error State
  isLoading: boolean = false;
  error: string = '';

  // Blog Data
  blog: BlogSM | null = null;
  relatedBlogs: BlogSM[] = [];

  // Table of Contents
  tocItems: Array<{ id: string; text: string; level: number }> = [];

  // Reading Progress
  readingProgress: number = 0;
  isReading: boolean = false;

  // Sharing
  shareUrl: string = '';
  showShareModal: boolean = false;

  // Comments (future)
  comments: any[] = [];
  commentCount: number = 0;

  // SEO (set dynamically)
  pageTitle: string = '';
  pageDescription: string = '';
  canonicalUrl: string = '';
  ogImage: string = '';
  structuredData: any = null;
}

/**
 * Blog Card Component View Model
 */
export class BlogCardViewModel extends BaseViewModel {
  blog: BlogSM = new BlogSM();
  layout: 'horizontal' | 'vertical' | 'compact' = 'vertical';
  showExcerpt: boolean = true;
  showCategory: boolean = true;
  showAuthor: boolean = true;
  showReadTime: boolean = true;
}
