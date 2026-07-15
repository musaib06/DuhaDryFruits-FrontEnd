import { WildValleyFoodsServiceModelBase } from "../../base/WildValleyFoods-service-model-base";

export class VideoSM extends WildValleyFoodsServiceModelBase<number> {
  title!: string;
  youtubeUrl!: string;        // validated URL
  description?: string;       // optional
  productId?: number;         // optional linked product
  productName?: string;       // product name for display
  featured?: boolean;         // optional featured flag
  category?: string;          // optional category
}