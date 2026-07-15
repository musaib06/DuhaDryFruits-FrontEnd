import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";
import { CustomerAddressSM } from "./CustomerAddress-s-m";


export class CustomerSM extends WildValleyFoodsServiceModelBase<number> {
  firstName!: string;
  lastName!: string;
  email!: string;
  phoneNumber!: string;
  addresses?: CustomerAddressSM[];
}
