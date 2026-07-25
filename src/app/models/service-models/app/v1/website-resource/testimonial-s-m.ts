import { DuhaDryFruitsServiceModelBase } from "../../base/DuhaDryFruits-service-model-base";

export class TestimonialSM extends DuhaDryFruitsServiceModelBase<number> {
  name!: string;
  email!: string;
  message!: string;
  rating?: number; 
}