import { BaseViewModel } from "../../../internal/base.viewmodel";
import { SupplierSM } from "../../../service-models/app/v1/supplier-s-m";

export class SupplierViewModel extends BaseViewModel{
    Suppliers: SupplierSM[] = [];
    Supplier:SupplierSM=new SupplierSM()
 updateMode: boolean = false;
}