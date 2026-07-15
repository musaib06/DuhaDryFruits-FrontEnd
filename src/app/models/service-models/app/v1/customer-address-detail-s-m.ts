import { WildValleyFoodsServiceModelBase } from '../base/WildValleyFoods-service-model-base';
import { AddressType } from '../enums/address-type-s-m.enum';

export class CustomerAddressDetailSM extends WildValleyFoodsServiceModelBase<number> {
  addressLine1!: string;
  addressLine2?: string;
  city!: string;
  state!: string;
  postalCode!: string;
  country!: string;
  addressType!: AddressType;
}
