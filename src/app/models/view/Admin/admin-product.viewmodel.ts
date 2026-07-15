import { BaseViewModel } from '../../internal/base.viewmodel';
import { CategorySM } from '../../service-models/app/v1/categories-s-m';
import { ProductSM } from '../../service-models/app/v1/product-s-m';
import { UnitsSM } from '../../service-models/app/v1/units-s-m';
import { BoolResponseRoot } from '../../service-models/foundation/common-response/bool-response-root';
import { UserProductViewModel } from '../end-user/product/user-product.viewmodel';
import { AdminCategoriesViewModel } from './admin.categories.viewmodel';

export class AdminProductsViewModel extends BaseViewModel {
  fileName: string = '';
  updateMode: boolean = false;
  productFormData: ProductSM = new ProductSM();
  singleProduct: ProductSM | null = null;
  products: ProductSM[] = [];
  filteredProducts: ProductSM[] = [];
  Units:UnitsSM[]=[];
  categories: CategorySM[] = []; // for dropdown
  categoryViewModel:AdminCategoriesViewModel=new AdminCategoriesViewModel();
  userProductViewModel:UserProductViewModel=new UserProductViewModel();
  searchTerm = '';
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  categoryId: number=0;
  searchstring:string='';
  boolResponseRoot:BoolResponseRoot=new BoolResponseRoot();
}
