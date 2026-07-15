import { BaseViewModel } from "../../internal/base.viewmodel";
import { ProductSM } from "../../service-models/app/v1/product-s-m";
import { AdminCategoriesViewModel } from "../Admin/admin.categories.viewmodel";

export class HeaderViewModel  extends BaseViewModel {
    categoriesViewModel:AdminCategoriesViewModel=new AdminCategoriesViewModel();
      isLoggedIn: boolean = false;
      cartItems: ProductSM[] = [];
      wishListItems: ProductSM[] = [];
      subTotal = 0;

}