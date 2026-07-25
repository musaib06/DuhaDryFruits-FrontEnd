import { DuhaDryFruitsServiceModelBase } from '../base/DuhaDryFruits-service-model-base';

/**
 * Product FAQ Service Model
 * Mirrors the backend ProductFaq model.
 */
export class ProductFaqSM extends DuhaDryFruitsServiceModelBase<number> {
  productId!: number;
  question!: string;
  answer!: string;
  displayOrder: number = 0;
  isActive: boolean = true;
}
