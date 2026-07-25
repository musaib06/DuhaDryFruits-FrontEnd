export interface BulkOrderItemSM {
  id?: number;
  productId?: number;
  productVariantId?: number;
  productName: string;
  sku?: string;
  packagingDetails?: string;
  unit?: string;
  requestedQuantity: number;
  unitPrice?: number;
  lineTotal?: number;
  specialInstructions?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  stockStatus?: string;
  minQuantity?: number;
  availableQuantity?: number;
}

export interface BulkOrderCustomRequestSM {
  id?: number;
  productName: string;
  description?: string;
  requiredQuantity: number;
  packaging?: string;
  expectedBudget?: number;
  expectedDeliveryDate?: string;
  additionalNotes?: string;
}

export interface BulkOrderPaymentSM {
  id?: number;
  paymentLink?: string;
  paymentLinkId?: string;
  amount?: number;
  paymentStatus?: string;
  transactionId?: string;
  generatedAt?: string;
  expiresAt?: string;
  paidAt?: string;
}

export interface BulkOrderTrackingSM {
  courier?: string;
  trackingNumber?: string;
  dispatchDate?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  currentStage?: string;
  isPacked?: boolean;
  invoiceNumber?: string;
}

export interface BulkOrderTimelineStep {
  key: string;
  label: string;
  completed: boolean;
  timestamp?: string;
  remarks?: string;
}

export interface BulkOrderActivityLog {
  action?: string;
  description?: string;
  createdOnUTC?: string;
  createdBy?: string;
}

export interface BulkOrderSM {
  id?: number;
  orderNumber?: string;
  customerId?: number;
  companyName: string;
  gstNumber?: string;
  businessType?: string;
  contactPerson: string;
  phone: string;
  email: string;
  shippingAddress: string;
  billingAddress?: string;
  city: string;
  state: string;
  country?: string;
  pinCode: string;
  status?: string;
  subtotal?: number;
  discount?: number;
  freight?: number;
  tax?: number;
  finalAmount?: number;
  paidAmount?: number;
  customerNotes?: string;
  adminRemarks?: string;
  expectedDeliveryDate?: string;
  rejectionReason?: string;
  items?: BulkOrderItemSM[];
  customRequests?: BulkOrderCustomRequestSM[];
  payments?: BulkOrderPaymentSM[];
  tracking?: BulkOrderTrackingSM;
  timeline?: BulkOrderTimelineStep[];
  statusHistory?: unknown[];
  activityLogs?: BulkOrderActivityLog[];
  attachments?: unknown[];
  createdOnUTC?: string;
}

export interface BulkOrderListResponse {
  items: BulkOrderSM[];
  totalCount: number;
  skip: number;
  top: number;
}

export interface BulkOrderDashboardData {
  kpis: {
    todayRequests: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
    awaitingPayment: number;
    paidOrders: number;
    revenue: number;
    monthlyRevenue: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  charts: {
    statusBreakdown?: Array<{ status: string; count: string | number }>;
    monthlyRequests?: Array<{ month: string; count: string | number }>;
    topProducts?: Array<{ productName: string; totalQty: string | number }>;
    topCustomers?: Array<{ companyName: string; email?: string; orderCount: string | number; totalSpent: string | number }>;
  };
  recentRequests: BulkOrderSM[];
}

export interface BulkCartItem {
  productId: number;
  productVariantId: number;
  productName: string;
  sku?: string;
  unit?: string;
  packagingDetails?: string;
  unitPrice?: number;
  requestedQuantity: number;
  specialInstructions?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  stockStatus?: string;
  minQuantity?: number;
  availableQuantity?: number;
  imageUrl?: string;
}

export interface BulkCartCustomItem {
  productName: string;
  description?: string;
  requiredQuantity: number;
  packaging?: string;
  expectedBudget?: number;
  expectedDeliveryDate?: string;
  additionalNotes?: string;
}
