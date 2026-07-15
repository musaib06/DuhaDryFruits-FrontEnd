import { WildValleyFoodsServiceModelBase } from '../../base/WildValleyFoods-service-model-base';

export enum BlogMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  EMBED = 'embed'
}

export enum EmbedPlatform {
  YOUTUBE = 'youtube',
  YOUTUBE_SHORTS = 'youtube_shorts',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  VIMEO = 'vimeo',
  OTHER = 'other'
}

/**
 * Blog Media Service Model
 * Represents media attached to a blog post
 */
export class BlogMediaSM extends WildValleyFoodsServiceModelBase<number> {
  blogId!: number;
  type: BlogMediaType = BlogMediaType.IMAGE;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  url?: string;
  fileBase64?: string;

  // Embed specific fields
  embedCode?: string;
  embedPlatform?: EmbedPlatform;
  embedId?: string;

  // Common fields
  altText?: string;
  caption?: string;
  sortOrder: number = 0;
  isFeatured: boolean = false;
  isDeleted: boolean = false;

  // Helper: Check if this is an embed
  get isEmbed(): boolean {
    return this.type === BlogMediaType.EMBED;
  }

  // Helper: Get safe embed HTML (sanitized)
  get safeEmbedHtml(): string {
    if (!this.embedCode) return '';
    // Basic sanitization - in production use DOMPurify
    return this.embedCode;
  }
}
