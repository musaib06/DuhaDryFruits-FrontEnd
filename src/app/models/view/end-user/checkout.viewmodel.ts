import { BaseViewModel } from '../../internal/base.viewmodel';
import { CustomerAddressDetailSM } from '../../service-models/app/v1/customer-address-detail-s-m';
import { CustomerDetailSM } from '../../service-models/app/v1/customer-detail-s-m';
import { ProductSM } from '../../service-models/app/v1/product-s-m';

export class CheckoutViewModel extends BaseViewModel {
  cartItems: ProductSM[] = [];
  totalPrice: number = 0;
  paymentMethod: string = 'online';
  customer: CustomerDetailSM = new CustomerDetailSM();
  submitted = false;
  workAddress: CustomerAddressDetailSM = new CustomerAddressDetailSM();
  homeAddress: CustomerAddressDetailSM = new CustomerAddressDetailSM();
  otherAddress: CustomerAddressDetailSM = new CustomerAddressDetailSM();
  createdCustomer: any;
}
