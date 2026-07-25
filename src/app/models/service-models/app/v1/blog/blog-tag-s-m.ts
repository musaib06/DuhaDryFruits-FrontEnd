import { DuhaDryFruitsServiceModelBase } from '../../base/DuhaDryFruits-service-model-base';

/**
 * Blog Tag Service Model
 * Represents a blog tag in the system
 */
export class BlogTagSM extends DuhaDryFruitsServiceModelBase<number> {
  name!: string;
  slug!: string;
  color: string = '#667eea';
  isActive: boolean = true;
  isDeleted: boolean = false;
  usageCount: number = 0;
}
