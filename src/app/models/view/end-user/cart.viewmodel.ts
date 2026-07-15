import { BaseViewModel } from '../../internal/base.viewmodel';
import { ProductSM } from '../../service-models/app/v1/product-s-m';
import { BannerSM } from '../../service-models/app/v1/website-resource/banner-s-m';
import { BannerViewModel } from '../website-resource/banner.viewmodel';

export class CartViewModel extends BaseViewModel {
  taxRate: number = 0;
  cartItems: ProductSM[] = [];
  subTotal: number = 0;
  tax: number = 0;
  total: number = 0;
}
