import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";

export class SupplierSM extends DuhaDryFruitsServiceModelBase<number> {
    name!: string;
    emailId!: string;
    phoneNumber!: string;
    country!: string;
    city!: string;
    zipCode!: string;
    address!: string;
    companyName!: string;
}
