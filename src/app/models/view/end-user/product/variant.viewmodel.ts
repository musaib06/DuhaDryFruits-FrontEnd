import { BaseViewModel } from "../../../internal/base.viewmodel";
import { ProductVariantSM } from "../../../service-models/app/v1/variants-s-m";

export class VariantViewModel extends BaseViewModel{
     updateMode: boolean = false;
     variants: ProductVariantSM[] = []
    variant:ProductVariantSM=new ProductVariantSM()
}