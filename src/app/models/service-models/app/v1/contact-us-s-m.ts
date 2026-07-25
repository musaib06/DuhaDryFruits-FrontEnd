import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";

export class ContactUsSM extends DuhaDryFruitsServiceModelBase<number> {
  name!: string;
  email!: string;
  description?: string;
}