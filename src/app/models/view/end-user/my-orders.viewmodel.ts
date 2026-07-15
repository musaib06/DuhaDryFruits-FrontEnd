import { BaseViewModel } from '../../internal/base.viewmodel';
import { OrderSM } from '../../service-models/app/v1/order-s-m';

export class MyOrdersViewModel extends BaseViewModel {
  orders: OrderSM[] = [];
  loading = false;
  error = '';
  totalCount = 0;
  customerEmail: string = '';
  
  filters: {
    status?: string;
    search?: string;
    customerEmail?: string;
  } = {};
  
  // Pagination
  override pagination = {
    PageNo: 1,
    PageSize: 5,
    totalCount: 0,
    totalPages: [] as number[]
  };
}

