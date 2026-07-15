import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";

export class SupplierSM extends WildValleyFoodsServiceModelBase<number> {
    name!: string;
    emailId!: string;
    phoneNumber!: string;
    country!: string;
    city!: string;
    zipCode!: string;
    address!: string;
    companyName!: string;
}
