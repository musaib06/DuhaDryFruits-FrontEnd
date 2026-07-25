import { BaseViewModel } from '../../internal/base.viewmodel';
import { DashboardSM } from '../../service-models/app/v1/dashboard-s-m';
import { OrderSM } from '../../service-models/app/v1/order-s-m';

export class AdminDashboardViewModel extends BaseViewModel {
  dashboardData?: DashboardSM;
  loading = false;
  error = '';
  
  // KPI Data (for easy access)
  totalSales = '₹0';
  totalOrders = 0;
  activeUsers = 0;
  totalCustomers = 0;
  returnRate = '0%';
  todaySales = '₹0';
  todayOrders = 0;
  thisMonthSales = '₹0';
  thisMonthOrders = 0;
  pendingOrders = 0;
  lowStockProducts = 0;
  productsSold = 0;

  // Chart Data
  monthlySalesLabels: string[] = [];
  monthlySalesData: number[] = [];
  monthlySalesOrders: number[] = [];
  
  categorySalesLabels: string[] = [];
  categorySalesData: number[] = [];
  categorySalesPercentages: string[] = [];
  
  dailyVisitors: Array<{
    date: string;
    visitors: number;
    avgTime: string;
  }> = [];
  
  dailyVisitorsNotification?: {
    message: string;
    type: string;
    cleanupTime: string;
    retentionPeriod: string;
    exportAvailable: boolean;
    exportMessage: string;
  };
  
  // Widget Data
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    amount: number;
    status: string;
    customerName: string;
    customerEmail: string;
    createdAt: Date | string;
  }> = [];
  
  topProducts: Array<{
    productId: number;
    productName: string;
    sku: string;
    totalQuantity: number;
    totalRevenue: number;
  }> = [];

  bulkOrderSummary?: {
    todayRequests: number;
    pending: number;
    revenue: number;
    growth: number;
  };
}

