import { WildValleyFoodsServiceModelBase } from '../base/WildValleyFoods-service-model-base';

export class BrandSM extends WildValleyFoodsServiceModelBase<number> {
  name!: string;
  imagePath!: string;
  productCount!: number;
}
