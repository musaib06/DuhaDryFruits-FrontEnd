import { BaseViewModel } from "../../../internal/base.viewmodel";
import { CategorySM } from "../../../service-models/app/v1/categories-s-m";
import { ProductCategorySM } from "../../../service-models/app/v1/product-category-s-m";


export class CategoriesViewModel extends BaseViewModel {
  fileName: string = '';
  updateMode: boolean = false;
  singleCategory = new ProductCategorySM();
  categories: CategorySM[] = [];
}
