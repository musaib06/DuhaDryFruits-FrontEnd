import { WildValleyFoodsServiceModelBase } from "../base/WildValleyFoods-service-model-base";

export class CustomerAddressSM extends WildValleyFoodsServiceModelBase<number> {
  customerDetailId!: number;   
  addressLine1!: string;
  addressLine2?: string;
  city!: string;
  state!: string;
  country!: string;
  postalCode!: string;
  isDefault?: boolean;   
}
