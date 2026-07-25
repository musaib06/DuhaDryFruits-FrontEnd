import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";

export class ReviewSM extends DuhaDryFruitsServiceModelBase<number> {
  name!: string;              // customer/admin name
  email!: string;             // customer/admin email
  rating!: number;            // 1 to 5 stars
  comment!: string;          
  productId!: number;
  isApproved!:boolean;
}