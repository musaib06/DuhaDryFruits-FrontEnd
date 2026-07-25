import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../../../../../services/blog.service';
import { BlogAdminViewModel } from '../../../../../../models/view/Admin/blog-admin.viewmodel';
import { BlogSM, BlogStatus } from '../../../../../../models/service-models/app/v1/blog/blog-s-m';
import { resolveBlogFeatureImage } from '../../../../../../utils/image-url.util';

/**
 * Admin Blog Management Component
 */
@Component({
  selector: 'app-blog-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './blog-admin.component.html',
  styleUrls: ['./blog-admin.component.scss']
})
export class BlogAdminComponent implements OnInit {
  viewModel: BlogAdminViewModel = new BlogAdminViewModel();

  // UI State
  showCategories = false;
  showTags = false;

  // Category Form
  categoryForm: CategoryForm = { id: null, name: '', slug: '', color: '#667eea' };

  // Tag Form
  tagForm: TagForm = { id: null, name: '', slug: '', color: '#667eea' };

  constructor(private blogService: BlogService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.loadCategories();
    await this.loadTags();
    await this.loadBlogs();
  }

  /** Load blog posts */
  async loadBlogs(): Promise<void> {
    await this.blogService.loadAdminBlogs(this.viewModel);
  }

  /** Load categories for filter */
  async loadCategories(): Promise<void> {
    this.viewModel.categories = await this.blogService.loadCategories();
  }

  /** Get status badge class */
  getStatusBadgeClass(status: BlogStatus): string {
    const classes: Record<BlogStatus, string> = {
      [BlogStatus.PUBLISHED]: 'bg-success',
      [BlogStatus.DRAFT]: 'bg-secondary',
      [BlogStatus.SCHEDULED]: 'bg-warning text-dark',
      [BlogStatus.ARCHIVED]: 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  /** Navigate to page */
  async goToPage(page: number): Promise<void> {
    if (page < 1 || page > this.viewModel.totalPages) return;
    this.viewModel.currentPage = page;
    await this.loadBlogs();
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
    this.viewModel.searchTerm = '';
    this.viewModel.statusFilter = '';
    this.viewModel.categoryFilter = null;
    this.viewModel.currentPage = 1;
    this.loadBlogs();
  }

  /** Navigate to create blog editor */
  createBlog(): void {
    this.router.navigate(['/admin/blog/create']);
  }

  /** Open editor for new blog (legacy inline — not used by template) */
  openEditor(): void {
    this.viewModel.showEditor = true;
    this.viewModel.isEditing = false;
  }

  /** Edit existing blog */
  editBlog(blog: BlogSM): void {
    this.router.navigate(['/admin/blog/edit', blog.id]);
  }

  /**
   * Open the public blog detail in a new tab.
   * Published blogs load via the public (SSR-safe) endpoint by slug. Drafts and
   * scheduled posts aren't public yet, so we pass ?preview=<id> which the detail
   * page resolves through the authenticated admin endpoint on the client.
   */
  viewBlog(blog: BlogSM): void {
    if (typeof window === 'undefined') return;
    const isPublished = blog.status === BlogStatus.PUBLISHED;
    const tree = this.router.createUrlTree(
      ['/journal', blog.slug],
      isPublished ? {} : { queryParams: { preview: blog.id } }
    );
    window.open(this.router.serializeUrl(tree), '_blank');
  }

  /** Delete blog */
  async deleteBlog(blog: BlogSM): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) return;

    if (blog.id) {
      const success = await this.blogService.deleteBlog(blog.id);
      if (success) {
        await this.loadBlogs();
      }
    }
  }

  /** Save blog (create or update) — for inline editor if enabled */
  async saveBlog(): Promise<void> {
    const tagIds = this.viewModel.selectedTagIds?.length ? this.viewModel.selectedTagIds : [];
    let success: boolean;
    if (this.viewModel.isEditing && this.viewModel.blogFormData.id) {
      success = await this.blogService.updateBlog(
        this.viewModel.blogFormData,
        this.viewModel.mediaFiles,
        tagIds
      );
    } else {
      success = await this.blogService.createBlog(
        this.viewModel.blogFormData,
        this.viewModel.mediaFiles,
        tagIds
      );
    }

    if (success) {
      this.viewModel.showEditor = false;
      this.viewModel.isEditing = false;
      this.viewModel.blogFormData = new BlogSM();
      this.viewModel.mediaFiles = [];
      this.viewModel.selectedTagIds = [];
      await this.loadBlogs();
    }
  }

  /** Close editor */
  closeEditor(): void {
    this.viewModel.showEditor = false;
    this.viewModel.isEditing = false;
    this.viewModel.blogFormData = new BlogSM();
  }

  /** Generate slug from title */
  generateSlug(): void {
    if (!this.viewModel.blogFormData.slug && this.viewModel.blogFormData.title) {
      this.viewModel.blogFormData.slug = this.viewModel.blogFormData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }

  /** Generate category slug from name */
  generateCategorySlug(): void {
    if (this.categoryForm.name) {
      this.categoryForm.slug = this.categoryForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }

  /** Generate tag slug from name */
  generateTagSlug(): void {
    if (this.tagForm.name) {
      this.tagForm.slug = this.tagForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }

  /** Handle featured image file selection */
  onFeatureImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.viewModel.mediaFiles = [input.files[0]];
    }
  }

  /** Delete category */
  async deleteCategory(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    const success = await this.blogService.deleteCategory(id);
    if (success) {
      await this.loadCategories();
    }
  }

  /** Delete tag */
  async deleteTag(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    
    const success = await this.blogService.deleteTag(id);
    if (success) {
      await this.loadTags();
    }
  }

  /** Load tags */
  async loadTags(): Promise<void> {
    this.viewModel.tags = await this.blogService.loadTags();
  }

  // ==================== CATEGORY MODAL METHODS ====================

  /** Open category modal */
  openCategoryModal(): void {
    this.showCategories = true;
    this.resetCategoryForm();
  }

  /** Close category modal */
  closeCategoryModal(): void {
    this.showCategories = false;
    this.resetCategoryForm();
  }

  /** Reset category form */
  resetCategoryForm(): void {
    this.categoryForm = { id: null, name: '', slug: '', color: '#667eea' };
  }

  /** Edit category - populate form */
  editCategory(category: any): void {
    this.categoryForm = { ...category };
  }

  /** Save category (create or update) */
  async saveCategory(): Promise<void> {
    if (!this.categoryForm.name) return;

    // Auto-generate slug if not provided
    if (!this.categoryForm.slug) {
      this.categoryForm.slug = this.categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    let success: boolean;
    if (this.categoryForm.id) {
      success = await this.blogService.updateCategory(this.categoryForm.id, {
        name: this.categoryForm.name,
        slug: this.categoryForm.slug,
        color: this.categoryForm.color
      });
    } else {
      success = await this.blogService.createCategory({
        name: this.categoryForm.name,
        slug: this.categoryForm.slug,
        color: this.categoryForm.color
      });
    }

    if (success) {
      this.resetCategoryForm();
      await this.loadCategories();
    }
  }

  // ==================== TAG MODAL METHODS ====================

  /** Open tag modal */
  openTagModal(): void {
    this.showTags = true;
    this.resetTagForm();
  }

  /** Close tag modal */
  closeTagModal(): void {
    this.showTags = false;
    this.resetTagForm();
  }

  /** Reset tag form */
  resetTagForm(): void {
    this.tagForm = { id: null, name: '', slug: '', color: '#667eea' };
  }

  /** Edit tag - populate form */
  editTag(tag: any): void {
    this.tagForm = { ...tag };
  }

  /** Save tag (create or update) */
  async saveTag(): Promise<void> {
    if (!this.tagForm.name) return;

    // Auto-generate slug if not provided
    if (!this.tagForm.slug) {
      this.tagForm.slug = this.tagForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    let success: boolean;
    if (this.tagForm.id) {
      success = await this.blogService.updateTag(this.tagForm.id, {
        name: this.tagForm.name,
        slug: this.tagForm.slug,
        color: this.tagForm.color
      });
    } else {
      success = await this.blogService.createTag({
        name: this.tagForm.name,
        slug: this.tagForm.slug,
        color: this.tagForm.color
      });
    }

    if (success) {
      this.resetTagForm();
      await this.loadTags();
    }
  }

  blogImage(blog: BlogSM): string {
    return resolveBlogFeatureImage(blog);
  }
}

/** Category form interface */
interface CategoryForm {
  id: number | null;
  name: string;
  slug: string;
  color: string;
}

/** Tag form interface */
interface TagForm {
  id: number | null;
  name: string;
  slug: string;
  color: string;
}
