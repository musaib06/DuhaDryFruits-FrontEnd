import { WildValleyFoodsServiceModelBase } from '../../base/WildValleyFoods-service-model-base';
import { BlogCategorySM } from './blog-category-s-m';
import { BlogTagSM } from './blog-tag-s-m';
import { BlogMediaSM } from './blog-media-s-m';

/**
 * Blog Status Enum
 */
export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived'
}

/**
 * Blog Service Model
 * Represents a blog post in the system
 */
export class BlogSM extends WildValleyFoodsServiceModelBase<number> {
  title!: string;
  subtitle?: string;
  slug!: string;
  excerpt?: string;
  content!: string;
  contentHtml?: string;
  featureImage?: string;
  featureImageUrl?: string;
  featureImageBase64?: string;
  categoryId?: number | null;
  category?: BlogCategorySM;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
  status: BlogStatus = BlogStatus.DRAFT;
  isFeatured: boolean = false;
  isDeleted: boolean = false;
  publishDate?: Date | string;
  scheduledPublishDate?: Date | string;

  // SEO Fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageBase64?: string;
  /**
   * Resolved OG image URL. Populated by the API on detail responses and editable
   * in the admin editor. Kept as a plain (settable) field so class instances can
   * be built via Object.assign and bound with [(ngModel)] without throwing.
   */
  ogImageUrl?: string;

  // Content Metrics
  readTimeMinutes?: number;
  viewCount: number = 0;
  likeCount: number = 0;
  sortOrder: number = 0;

  // Relations
  tags: BlogTagSM[] = [];
  media: BlogMediaSM[] = [];

  /** Optional social video links (admin); thumbnails filled by API where possible */
  socialVideoYoutubeUrl?: string;
  socialVideoInstagramUrl?: string;
  socialVideoFacebookUrl?: string;
  socialVideoYoutubeThumbnailUrl?: string;
  socialVideoInstagramThumbnailUrl?: string;
  socialVideoFacebookThumbnailUrl?: string;

  // Helper: Get formatted publish date
  get formattedPublishDate(): string {
    if (!this.publishDate) return '';
    return new Date(this.publishDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Helper: Get formatted read time
  get formattedReadTime(): string {
    if (!this.readTimeMinutes) return '';
    return `${this.readTimeMinutes} min read`;
  }

  // Helper: Get display title (with fallback)
  get displayTitle(): string {
    return this.title || 'Untitled Blog';
  }

  // Helper: Get SEO title (metaTitle or title)
  get seoTitle(): string {
    return this.metaTitle || this.title || '';
  }

  // Helper: Get SEO description (metaDescription or excerpt or content preview)
  get seoDescription(): string {
    if (this.metaDescription) return this.metaDescription;
    if (this.excerpt) return this.excerpt.substring(0, 160);
    if (this.content) {
      // Strip HTML and get first 160 chars
      const stripped = this.content.replace(/<[^>]*>/g, '').substring(0, 157);
      return stripped + (stripped.length >= 157 ? '...' : '');
    }
    return '';
  }

  // Helper: Best available OG image (falls back to raw OG image, then featured)
  get resolvedOgImage(): string {
    return this.ogImageUrl || this.ogImage || this.featureImage || '';
  }

  // Helper: Is published
  get isPublished(): boolean {
    return this.status === BlogStatus.PUBLISHED && !this.isDeleted;
  }

  // Helper: Get tag names as comma-separated
  get tagNames(): string {
    return this.tags?.map(t => t.name).join(', ') || '';
  }
}
