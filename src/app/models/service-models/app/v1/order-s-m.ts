import { DuhaDryFruitsServiceModelBase } from '../base/DuhaDryFruits-service-model-base';
import { OrderRecordSM } from './order-record-s-m';
import { CustomerDetailSM } from './customer-detail-s-m';
import { PaymentSM } from './payment-s-m';

/**
 * Order Status Enum
 */
export enum OrderStatus {
  CREATED = 'created',
  PAID = 'paid',
  FAILED = 'failed',
  FLAGGED = 'flagged',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  PAYMENT_PENDING = 'payment_pending'
}

/**
 * Order Service Model
 */
export class OrderSM extends DuhaDryFruitsServiceModelBase<number> {
  order_id?: number;
  razorpayOrderId!: string;
  customerId!: number;
  amount!: number;
  paid_amount!: number;
  due_amount!: number;
  currency!: string;
  status!: OrderStatus | string;
  paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED';
  payment_status?: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentId?: string;
  signature?: string;
  receipt?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  invoice?: {
    id?: number;
    order_id?: number;
    invoice_date?: Date | string;
    payment_status?: 'UNPAID' | 'PAID' | 'REFUNDED';
    created_at?: Date | string;
    updated_at?: Date | string;
  } | null;
  
  // Relations
  items?: OrderRecordSM[];
  customer?: CustomerDetailSM;
  payments?: PaymentSM[];
  
  // Additional fields from API responses
  customerDetails?: {
    name: string;
    email: string;
    contact: string;
  };
}

