import { DuhaDryFruitsServiceModelBase } from '../base/DuhaDryFruits-service-model-base';
import { CustomerDetailSM } from './customer-detail-s-m';
import { CustomerAddressDetailSM } from './customer-address-detail-s-m';
import { OrderRecordSM } from './order-record-s-m';
import { PaymentSM } from './payment-s-m';

/**
 * Invoice Item Model
 */
export class InvoiceItemSM {
  id!: number;
  productName!: string;
  variantSku?: string;
  variantDetails?: {
    quantity: number;
    unitSymbol: string;
    unitName: string;
    /** Net / pack weight in grams (from ProductVariant) */
    weight?: number | null;
  };
  quantity!: number;
  unitPrice!: number;
  total!: number;
}

/**
 * Invoice Totals Model
 */
export class InvoiceTotalsSM {
  subtotal!: string;
  taxAmount!: string;
  shippingAmount!: string;
  totalAmount!: string;
  paidAmount!: string;
  dueAmount!: string;
}

/**
 * Invoice Payment Info Model
 */
export class InvoicePaymentSM {
  razorpayPaymentId?: string;
  status?: string;
  method?: string;
  paidAt?: Date | string;
}

/**
 * Invoice Service Model
 */
export class InvoiceSM extends DuhaDryFruitsServiceModelBase<number> {
  invoiceNumber!: string;
  orderNumber!: string;
  invoiceDate!: Date | string;
  dueDate?: Date | string;
  
  // Customer Information (for detail view)
  customer?: {
    id: number;
    name: string;
    email: string;
    contact: string;
    address: CustomerAddressDetailSM | null;
  };
  
  // Customer Information (for list view - flat structure from getAllInvoices)
  customerName?: string;
  customerEmail?: string;
  
  // Order Items
  items: InvoiceItemSM[] = [];
  
  // Totals (for detail view)
  totals?: InvoiceTotalsSM;
  
  // Amount (for list view - flat structure from getAllInvoices)
  amount?: number;
  paidAmount?: number;
  dueAmount?: number;
  
  // Payment Information
  payment?: InvoicePaymentSM | null;
  
  // Order Status
  status!: string;
  currency!: string;
  
  // Metadata
  orderId?: number;
  invoiceId?: number; // Used in list view
  razorpayOrderId?: string;
  receipt?: string;
  createdAt?: Date | string;
}

