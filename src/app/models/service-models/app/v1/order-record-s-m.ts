import { WildValleyFoodsServiceModelBase } from '../base/WildValleyFoods-service-model-base';
import { ProductVariantSM } from './variants-s-m';
import { ProductSM } from './product-s-m';

/**
 * Order Record Service Model (Order Items)
 */
export class OrderRecordSM extends WildValleyFoodsServiceModelBase<number> {
  orderId!: number;
  productVariantId!: number;
  productId!: number;
  quantity!: number;
  price!: number;
  total!: number;
  
  // Relations
  variant?: ProductVariantSM;
  product?: ProductSM;
  
  // Additional fields from API responses
  variantDetails?: {
    sku: string;
    quantity: number;
    unitSymbol: string;
    unitName: string;
    price: number;
    weight?: number;
  };
}

