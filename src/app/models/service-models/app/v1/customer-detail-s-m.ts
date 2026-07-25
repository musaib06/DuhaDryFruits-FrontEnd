import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";
import { CustomerAddressDetailSM } from "./customer-address-detail-s-m";

export class CustomerDetailSM extends DuhaDryFruitsServiceModelBase<number> {
  firstName!: string;
  lastName!: string;
  email!: string;
  contact!: string;
  addresses!: CustomerAddressDetailSM[];
  }