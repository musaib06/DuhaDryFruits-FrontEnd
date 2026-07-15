import { BaseViewModel } from "../../../internal/base.viewmodel";
import { BrandSM } from "../../../service-models/app/v1/brand-s-m";


export class BrandViewModel extends BaseViewModel {
  public multiple: boolean = false;
  brands: BrandSM[] = [];
  brand = new BrandSM();
  fileName!: string;
  updateMode: boolean = false;
}
