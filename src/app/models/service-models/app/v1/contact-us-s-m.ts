import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";

export class ContactUsSM extends WildValleyFoodsServiceModelBase<number> {
  name!: string;
  email!: string;
  description?: string;
}