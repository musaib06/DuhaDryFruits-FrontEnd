import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";
import { CustomerAddressDetailSM } from "./customer-address-detail-s-m";

export class CustomerDetailSM extends WildValleyFoodsServiceModelBase<number> {
  firstName!: string;
  lastName!: string;
  email!: string;
  contact!: string;
  addresses!: CustomerAddressDetailSM[];
  }