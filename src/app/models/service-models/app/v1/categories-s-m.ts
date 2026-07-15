import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";


export class CategorySM extends WildValleyFoodsServiceModelBase<number> {
  name!: string;
  description!: string;
  category_icon!: string;
  category_icon_url?: string;
  category_icon_base64?: string;
  slider!: boolean;
  sequence!: number;
  status!: 'active' | 'inactive';
}
