import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";

export class ReviewSM extends WildValleyFoodsServiceModelBase<number> {
  name!: string;              // customer/admin name
  email!: string;             // customer/admin email
  rating!: number;            // 1 to 5 stars
  comment!: string;          
  productId!: number;
  isApproved!:boolean;
}