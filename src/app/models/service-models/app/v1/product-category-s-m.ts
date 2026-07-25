import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";
import { CategoryLevelSM } from "./category-level-s-m-enum";


export class ProductCategorySM extends DuhaDryFruitsServiceModelBase<number> {
    name!: string;
    levelId!: number;
    level!: CategoryLevelSM;
    status!: boolean;
    productCount?: number;
}
