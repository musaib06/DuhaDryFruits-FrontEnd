import { BaseViewModel } from "../../../internal/base.viewmodel";
import { CustomerSM } from "../../../service-models/app/v1/customer-s-m";

export class CustomerViewModel extends BaseViewModel{
    customers: CustomerSM[] = [];
    customer:CustomerSM=new CustomerSM()
 updateMode: boolean = false;
}