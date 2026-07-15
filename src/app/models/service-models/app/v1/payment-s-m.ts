import { WildValleyFoodsServiceModelBase } from '../base/WildValleyFoods-service-model-base';
import { OrderSM } from './order-s-m';
import { CustomerDetailSM } from './customer-detail-s-m';

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  CAPTURED = 'captured',
  AUTHORIZED = 'authorized',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

/**
 * Payment Method Enum
 */
export enum PaymentMethod {
  CARD = 'card',
  UPI = 'upi',
  NETBANKING = 'netbanking',
  WALLET = 'wallet',
  EMI = 'emi',
  PAYLATER = 'paylater'
}

/**
 * Payment Service Model
 */
export class PaymentSM extends WildValleyFoodsServiceModelBase<number> {
  razorpayPaymentId!: string;
  razorpayOrderId!: string;
  orderId!: number;
  customerId!: number;
  amount!: number;
  amountPaise!: number;
  currency!: string;
  status!: PaymentStatus | string;
  method?: PaymentMethod | string;
  signature?: string;
  isAmountValid!: boolean;
  isProcessed!: boolean;
  processedAt?: Date | string;
  
  // Relations
  order?: OrderSM;
  customer?: CustomerDetailSM;
  
  // Metadata from Razorpay
  metadata?: {
    razorpayPayment?: any;
    razorpayOrder?: any;
    event?: string;
  };
}

