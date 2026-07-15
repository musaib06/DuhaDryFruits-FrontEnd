import { BaseViewModel } from '../../internal/base.viewmodel';
import { BlogSM, BlogStatus } from '../../service-models/app/v1/blog/blog-s-m';
import { BlogCategorySM } from '../../service-models/app/v1/blog/blog-category-s-m';
import { BlogTagSM } from '../../service-models/app/v1/blog/blog-tag-s-m';
import { BlogMediaSM } from '../../service-models/app/v1/blog/blog-media-s-m';

/**
 * Admin Blog Management View Model
 */
export class BlogAdminViewModel extends BaseViewModel {
  // Loading & Error State
  isLoading: boolean = false;
  error: string = '';

  // Blog List
  blogs: BlogSM[] = [];
  filteredBlogs: BlogSM[] = [];
  selectedBlog: BlogSM | null = null;

  // Form Data
  blogFormData: BlogSM = new BlogSM();
  isEditing: boolean = false;

  // Categories & Tags for dropdowns
  categories: BlogCategorySM[] = [];
  tags: BlogTagSM[] = [];
  selectedTagIds: number[] = [];

  // Media
  mediaFiles: File[] = [];
  embedUrls: string[] = [];

  // Filters
  searchTerm: string = '';
  statusFilter: BlogStatus | '' = '';
  categoryFilter: number | null = null;
  sortField: string = 'createdOnUTC';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  totalPages: number = 0;

  // UI State
  showEditor: boolean = false;
  showPreview: boolean = false;
  isSaving: boolean = false;
  activeTab: 'content' | 'seo' | 'media' = 'content';

  // SEO Preview
  seoPreviewUrl: string = '';
}

/**
 * Admin Blog Category View Model
 */
export class BlogCategoryAdminViewModel extends BaseViewModel {
  categories: BlogCategorySM[] = [];
  categoryFormData: BlogCategorySM = new BlogCategorySM();
  isEditing: boolean = false;
  showModal: boolean = false;
}

/**
 * Admin Blog Tag View Model
 */
export class BlogTagAdminViewModel extends BaseViewModel {
  tags: BlogTagSM[] = [];
  tagFormData: BlogTagSM = new BlogTagSM();
  isEditing: boolean = false;
  showModal: boolean = false;
  newTagName: string = '';
}
