import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";
import { CustomerAddressSM } from "./CustomerAddress-s-m";


export class CustomerSM extends DuhaDryFruitsServiceModelBase<number> {
  firstName!: string;
  lastName!: string;
  email!: string;
  phoneNumber!: string;
  addresses?: CustomerAddressSM[];
}
