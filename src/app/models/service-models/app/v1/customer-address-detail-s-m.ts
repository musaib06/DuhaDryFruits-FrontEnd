import { DuhaDryFruitsServiceModelBase } from '../base/DuhaDryFruits-service-model-base';
import { AddressType } from '../enums/address-type-s-m.enum';

export class CustomerAddressDetailSM extends DuhaDryFruitsServiceModelBase<number> {
  addressLine1!: string;
  addressLine2?: string;
  city!: string;
  state!: string;
  postalCode!: string;
  country!: string;
  addressType!: AddressType;
}
