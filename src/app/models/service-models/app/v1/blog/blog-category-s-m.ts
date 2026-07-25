import { DuhaDryFruitsServiceModelBase } from '../../base/DuhaDryFruits-service-model-base';

/**
 * Blog Category Service Model
 * Represents a blog category in the system
 */
export class BlogCategorySM extends DuhaDryFruitsServiceModelBase<number> {
  name!: string;
  slug!: string;
  description?: string;
  icon?: string;
  iconBase64?: string;
  color: string = '#f5a623';
  sortOrder: number = 0;
  isActive: boolean = true;
  isDeleted: boolean = false;
  metaTitle?: string;
  metaDescription?: string;

  // Helper: Get display name
  get displayName(): string {
    return this.name || 'Uncategorized';
  }
}
