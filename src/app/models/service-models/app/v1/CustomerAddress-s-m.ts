import { DuhaDryFruitsServiceModelBase } from "../base/DuhaDryFruits-service-model-base";

export class CustomerAddressSM extends DuhaDryFruitsServiceModelBase<number> {
  customerDetailId!: number;   
  addressLine1!: string;
  addressLine2?: string;
  city!: string;
  state!: string;
  country!: string;
  postalCode!: string;
  isDefault?: boolean;   
}
