import { DuhaDryFruitsServiceModelBase } from '../base/DuhaDryFruits-service-model-base';

export class BrandSM extends DuhaDryFruitsServiceModelBase<number> {
  name!: string;
  imagePath!: string;
  productCount!: number;
}
