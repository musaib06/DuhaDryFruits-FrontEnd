import { BaseViewModel } from '../../internal/base.viewmodel';
import { InvoiceSM } from '../../service-models/app/v1/invoice-s-m';

export class InvoiceViewModel extends BaseViewModel {
  invoices: InvoiceSM[] = [];
  selectedInvoice?: InvoiceSM;
  
  filters: {
    status?: string;
    customerId?: number;
    customerName?: string;
    startDate?: string;
    endDate?: string;
  } = {};
  
  customers: Array<{ id: number; firstName: string; lastName: string; fullName: string }> = [];
  
  loading = false;
  error = '';
  totalCount = 0;
}

