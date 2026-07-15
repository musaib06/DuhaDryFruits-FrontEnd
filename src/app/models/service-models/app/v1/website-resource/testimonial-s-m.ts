import { WildValleyFoodsServiceModelBase } from "../../base/WildValleyFoods-service-model-base";

export class TestimonialSM extends WildValleyFoodsServiceModelBase<number> {
  name!: string;
  email!: string;
  message!: string;
  rating?: number; 
}