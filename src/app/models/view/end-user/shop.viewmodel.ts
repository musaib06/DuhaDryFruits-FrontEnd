import { BaseViewModel } from '../../internal/base.viewmodel';
import { ProductSM } from '../../service-models/app/v1/product-s-m';

export class ShopViewModel extends BaseViewModel {
      product = new ProductSM();
      selectedImageIndex = 0;
      loading = false;
      qty = 1;
      maxQty = 1;
      errorMsg = '';
      products!: ProductSM[];
      filteredProducts!: ProductSM[];
      categoryId!:number;
}
