import { BaseViewModel } from '../../internal/base.viewmodel';
import { ProductSM } from '../../service-models/app/v1/product-s-m';

export class WishListViewModel extends BaseViewModel {
  allItems: ProductSM[] = [];
  totalCount: number = 0;
  isMobile: boolean = false;
  searchTerm: string = '';
}
