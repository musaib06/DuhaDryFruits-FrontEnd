import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";
import { CategoryLevelSM } from "./category-level-s-m-enum";


export class ProductCategorySM extends WildValleyFoodsServiceModelBase<number> {
    name!: string;
    levelId!: number;
    level!: CategoryLevelSM;
    status!: boolean;
    productCount?: number;
}
