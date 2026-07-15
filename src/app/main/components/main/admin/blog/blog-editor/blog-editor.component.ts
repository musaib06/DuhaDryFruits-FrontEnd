import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { isAcceptedImageFile } from '../../../../../../utils/image-file.util';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BlogService } from '../../../../../../services/blog.service';
import { BlogSM, BlogStatus } from '../../../../../../models/service-models/app/v1/blog/blog-s-m';
import { BlogCategorySM } from '../../../../../../models/service-models/app/v1/blog/blog-category-s-m';
import { BlogTagSM } from '../../../../../../models/service-models/app/v1/blog/blog-tag-s-m';
import {
  BlogMediaSM,
  BlogMediaType,
} from '../../../../../../models/service-models/app/v1/blog/blog-media-s-m';
import { QuillEditorComponent } from 'ngx-quill';
import { resolveBlogMedia } from '../../../../../../utils/image-url.util';

@Component({
  selector: 'app-blog-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillEditorComponent],
  templateUrl: './blog-editor.component.html',
  styleUrls: ['./blog-editor.component.scss']
})
export class BlogEditorComponent implements OnInit, OnDestroy {
  /** Expose enum to template for status options */
  readonly BlogStatus = BlogStatus;

  blog: BlogSM = new BlogSM();
  isEditing = false;
  /** True only while fetching an existing post for edit (not while saving). */
  loadingBlog = false;
  /** True while create/update request is in flight. */
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  categories: BlogCategorySM[] = [];
  tags: BlogTagSM[] = [];
  selectedTagIds: number[] = [];

  /** New images to upload — first file becomes featured image on the API */
  pendingImages: { file: File; preview: string }[] = [];
  /** Existing gallery rows from API (optional extras beyond featured) */
  existingGallery: { id: number; src: string }[] = [];

  featureImagePreview: string | null = null;

  /** Quill editor modules configuration with full toolbar including image and video */
  quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }], // Heading levels
      ['bold', 'italic', 'underline', 'strike'], // Text formatting
      [{ list: 'ordered' }, { list: 'bullet' }], // Lists
      [{ indent: '-1' }, { indent: '+1' }], // Indentation
      [{ align: [] }], // Text alignment
      ['link', 'image', 'video'], // Media (image + video embed)
      ['blockquote', 'code-block'], // Blocks
      [{ color: [] }, { background: [] }], // Colors
      ['clean'] // Remove formatting
    ]
  };

  constructor(
    private blogService: BlogService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const blogId = this.route.snapshot.paramMap.get('id');

    await this.loadCategories();
    await this.loadTags();

    if (blogId) {
      this.isEditing = true;
      await this.loadBlog(parseInt(blogId, 10));
    } else {
      this.blog.categoryId = null;
      this.blog.status = BlogStatus.DRAFT;
    }
  }

  ngOnDestroy(): void {
    this.pendingImages.forEach((p) => {
      if (p.preview.startsWith('blob:')) URL.revokeObjectURL(p.preview);
    });
  }

  async loadBlog(id: number): Promise<void> {
    this.loadingBlog = true;
    try {
      const blog = await this.blogService.loadBlogById(id);
      if (blog) {
        this.isEditing = true;
        this.blog = Object.assign(new BlogSM(), blog);
        this.blog.categoryId = this.blog.categoryId ?? null;

        if (!this.blog.content && this.blog.contentHtml) {
          this.blog.content = this.blog.contentHtml;
        }

        if (this.blog.featureImage || this.blog.featureImageUrl) {
          this.featureImagePreview =
            this.blog.featureImageUrl || this.blog.featureImage || null;
        }

        this.selectedTagIds = this.blog.tags?.map((t: { id: number }) => t.id) || [];

        const media = this.blog.media || [];
        this.existingGallery = media
          .filter(
            (m: BlogMediaSM) =>
              (m.type === BlogMediaType.IMAGE || String(m.type) === 'image') &&
              !m.embedCode
          )
          .map((m: BlogMediaSM) => ({
            id: m.id as number,
            src: resolveBlogMedia(m),
          }))
          .filter((g) => g.id && g.src);
      }
    } catch (err) {
      this.errorMessage = 'Failed to load blog';
    } finally {
      this.loadingBlog = false;
    }
  }

  async loadCategories(): Promise<void> {
    this.categories = await this.blogService.loadCategories();
  }

  async loadTags(): Promise<void> {
    this.tags = await this.blogService.loadTags();
  }

  generateSlug(): void {
    if (!this.blog.slug && this.blog.title) {
      this.blog.slug = this.blog.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }

  /**
   * Opens the OS file picker via a real button + programmatic input.click().
   * Native `<input type="file" class="form-control">` often fails on this page (Quill/admin layout stacking).
   */
  openGalleryFilePicker(input: HTMLInputElement, ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    input.click();
  }

  onGalleryFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    for (const file of Array.from(input.files)) {
      if (!isAcceptedImageFile(file)) continue;
      const preview = URL.createObjectURL(file);
      this.pendingImages.push({ file, preview });
    }
    input.value = '';
    this.cdr.detectChanges();
  }

  removePendingImage(index: number): void {
    const p = this.pendingImages[index];
    if (p?.preview.startsWith('blob:')) URL.revokeObjectURL(p.preview);
    this.pendingImages.splice(index, 1);
  }

  async removeGalleryImage(row: { id: number; src: string }): Promise<void> {
    const ok = await this.blogService.deleteBlogMedia(row.id);
    if (ok) {
      this.existingGallery = this.existingGallery.filter((g) => g.id !== row.id);
    }
  }

  toggleTag(tagId: number): void {
    const index = this.selectedTagIds.indexOf(tagId);
    if (index > -1) {
      this.selectedTagIds.splice(index, 1);
    } else {
      this.selectedTagIds.push(tagId);
    }
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  private uploadFiles(): File[] {
    return this.pendingImages.map((p) => p.file);
  }

  async saveBlog(): Promise<void> {
    if (!this.blog.title) {
      this.errorMessage = 'Title is required';
      return;
    }

    const textOnly = (this.blog.content || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    if (!textOnly) {
      this.errorMessage = 'Please write some content for your blog post.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      this.blog.contentHtml = this.blog.content || '';

      const files = this.uploadFiles();

      if (this.isEditing && this.blog.id) {
        const ok = await this.blogService.updateBlog(
          this.blog,
          files,
          this.selectedTagIds
        );
        if (ok) {
          this.successMessage = 'Blog updated successfully!';
          this.pendingImages.forEach((p) => {
            if (p.preview.startsWith('blob:')) URL.revokeObjectURL(p.preview);
          });
          this.pendingImages = [];
          setTimeout(() => this.router.navigate(['/admin/blog']), 1500);
        } else {
          this.errorMessage =
            'Failed to update blog. Ensure you are logged in as Admin and try again.';
        }
      } else {
        const ok = await this.blogService.createBlog(
          this.blog,
          files,
          this.selectedTagIds
        );
        if (ok) {
          this.successMessage = 'Blog created successfully!';
          setTimeout(() => this.router.navigate(['/admin/blog']), 1500);
        } else {
          this.errorMessage =
            'Failed to create blog. Ensure required fields are set and you are logged in as Admin.';
        }
      }
    } catch (err) {
      this.errorMessage = 'Failed to save blog. Please try again.';
    } finally {
      this.isSaving = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/blog']);
  }
}
