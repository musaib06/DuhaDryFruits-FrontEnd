import { BaseViewModel } from '../../internal/base.viewmodel';
import { CategorySM } from '../../service-models/app/v1/categories-s-m';
import { ProductCategorySM } from '../../service-models/app/v1/product-category-s-m';

export class AdminCategoriesViewModel extends BaseViewModel {
  fileName: string = '';
  updateMode: boolean = false;
  categoryFormData:CategorySM=new CategorySM()
  singleCategory = new ProductCategorySM();
  categories: CategorySM[] = [];
  filteredCategories: CategorySM[] = [];
  searchTerm = '';
  sortField = 'sequence';
  sortDirection: 'asc' | 'desc' = 'asc';
}
