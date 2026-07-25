import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";

export class UnitsSM extends DuhaDryFruitsServiceModelBase<number> {
  name!: string;
  symbol!: string;
  multiplier!: number;
  isBaseUnit!: boolean;
  displayOrder!: number;
}