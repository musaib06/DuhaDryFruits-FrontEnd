import { WildValleyFoodsServiceModelBase } from '../base/WildValleyFoods-service-model-base';

/**
 * Product FAQ Service Model
 * Mirrors the backend ProductFaq model.
 */
export class ProductFaqSM extends WildValleyFoodsServiceModelBase<number> {
  productId!: number;
  question!: string;
  answer!: string;
  displayOrder: number = 0;
  isActive: boolean = true;
}
