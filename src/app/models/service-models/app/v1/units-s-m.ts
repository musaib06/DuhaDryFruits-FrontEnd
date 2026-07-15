import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";

export class UnitsSM extends WildValleyFoodsServiceModelBase<number> {
  name!: string;
  symbol!: string;
  multiplier!: number;
  isBaseUnit!: boolean;
  displayOrder!: number;
}