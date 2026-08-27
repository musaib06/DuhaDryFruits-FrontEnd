export interface PartnerSM {
  id?: number;
  partnerName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  sharePercent: number;
  effectiveFrom: string;
  status: string;
  createdOnUTC?: string;
  lastModifiedOnUTC?: string;
  percentageHistory?: PartnerPercentageHistorySM[];
}

export interface PartnerPercentageHistorySM {
  id?: number;
  partnerId: number;
  oldPercent?: number | null;
  newPercent: number;
  effectiveFrom: string;
  reason?: string;
  changedBy?: number;
  changedAt?: string;
  partner?: { id: number; partnerName: string };
}

export interface PartnerSettlementSM {
  id?: number;
  partnerId: number;
  periodMonth: string;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: string;
  transactionId?: string;
  bankReference?: string;
  notes?: string;
  attachmentUrl?: string;
  recordType?: string;
  isReversed?: boolean;
  reversalReason?: string;
  recordedBy?: number;
  createdOnUTC?: string;
  partner?: { id: number; partnerName: string };
}

export interface PartnerDailyRowSM {
  date: string;
  revenue: number;
  orderCount: number;
  percent: number;
  partnerShare: number;
  paymentsMade?: number;
  outstanding?: number;
}

export interface PartnerMonthlyRowSM {
  month: string;
  revenue: number;
  percent: number | null;
  percentLabel: string;
  partnerShare: number;
  paid: number;
  outstanding: number;
  status: string;
}

export interface PartnerDashboardSM {
  partner: PartnerSM | null;
  cards: {
    todayRevenue: number;
    todayShare: number;
    monthRevenue: number;
    monthShare: number;
    monthPaid: number;
    monthOutstanding: number;
    totalPaid: number;
    outstanding: number;
    currentPercent: number;
  };
  trend: PartnerDailyRowSM[];
}

export interface PartnerLedgerEntrySM {
  date: string;
  type: string;
  period: string;
  revenue?: number | null;
  percent?: number | null;
  partnerShare?: number | null;
  paid?: number | null;
  outstanding?: number | null;
  transactionId?: string | null;
  paymentMethod?: string;
  notes?: string;
  isReversed?: boolean;
}

export interface PartnerMetaSM {
  paymentMethods: string[];
  monthlyStatuses: string[];
  partnerStatuses: string[];
  defaultPercent: number;
  revenueRule: string;
}
