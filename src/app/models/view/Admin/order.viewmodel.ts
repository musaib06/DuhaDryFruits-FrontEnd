import { BaseViewModel } from '../../internal/base.viewmodel';
import { OrderSM } from '../../service-models/app/v1/order-s-m';

export class OrderViewModel extends BaseViewModel {
  orders: OrderSM[] = [];
  selectedOrder?: OrderSM;
  
  filters: {
    status?: string;
    customerId?: number;
    customerName?: string;
    customerEmail?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
  } = {};
  
  customers: Array<{ id: number; firstName: string; lastName: string; fullName: string }> = [];
  
  loading = false;
  error = '';
  totalCount = 0;
}

