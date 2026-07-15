import { WildValleyFoodsServiceModelBase } from '../base/WildValleyFoods-service-model-base';
import { OrderSM } from './order-s-m';

/**
 * Dashboard KPIs Model
 */
export class DashboardKPISM {
  totalSales!: string;
  totalOrders!: number;
  activeUsers!: number;
  totalCustomers!: number;
  returnRate!: string;
  todaySales!: string;
  todayOrders!: number;
  thisMonthSales!: string;
  thisMonthOrders!: number;
  pendingOrders!: number;
  productsSold!: number;
  lowStockProducts!: number;
}

/**
 * Monthly Sales Data Model
 */
export class MonthlySalesSM {
  month!: string;
  sales!: number;
  orders!: number;
}

/**
 * Category Sales Data Model
 */
export class CategorySalesSM {
  categoryId!: number;
  categoryName!: string;
  sales!: number;
  quantity!: number;
}

/**
 * Dashboard Charts Model
 */
export class DashboardChartsSM {
  monthlySales!: {
    labels: string[];
    data: number[];
    orders: number[];
  };
  categorySales!: {
    labels: string[];
    data: number[];
    percentages: string[];
    raw: CategorySalesSM[];
  };
  dailyVisitors!: Array<{
    date: string;
    visitors: number;
    avgTime: string;
  }>;
  dailyVisitorsNotification?: {
    message: string;
    type: string;
    cleanupTime: string;
    retentionPeriod: string;
    exportAvailable: boolean;
    exportMessage: string;
  };
}

/**
 * Top Product Model
 */
export class TopProductSM {
  productId!: number;
  productName!: string;
  sku!: string;
  totalQuantity!: number;
  totalRevenue!: number;
}

/**
 * Dashboard Widgets Model
 */
export class DashboardWidgetsSM {
  recentOrders!: Array<{
    id: number;
    orderNumber: string;
    amount: number;
    status: string;
    customerName: string;
    customerEmail: string;
    createdAt: Date | string;
  }>;
  topProducts!: TopProductSM[];
}

/**
 * Dashboard Service Model
 */
export class DashboardSM extends WildValleyFoodsServiceModelBase<number> {
  kpis!: DashboardKPISM;
  charts!: DashboardChartsSM;
  widgets!: DashboardWidgetsSM;
  lastUpdated!: string;
}

