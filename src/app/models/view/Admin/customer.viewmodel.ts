import { BaseViewModel } from '../../internal/base.viewmodel';
import { CustomerDetailSM } from '../../service-models/app/v1/customer-detail-s-m';

export class CustomerViewModel extends BaseViewModel {
  customers: CustomerDetailSM[] = [];
  selectedCustomer?: CustomerDetailSM;
  
  filters: {
    search?: string;
  } = {};
  
  loading = false;
  error = '';
  totalCount = 0;
}

