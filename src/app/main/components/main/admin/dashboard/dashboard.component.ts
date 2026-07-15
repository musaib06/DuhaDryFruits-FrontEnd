import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../base.component';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { DashboardService } from '../../../../../services/dashboard.service';
import { ExportService } from '../../../../../services/export.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminDashboardViewModel } from '../../../../../models/view/Admin/dashboard.viewmodel';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [BaseChartDirective, CommonModule, RouterModule, FormsModule]
})
export class DashboardComponent extends BaseComponent<AdminDashboardViewModel> implements OnInit {
  protected _logHandler: LogHandlerService;

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private dashboardService: DashboardService,
    private exportService: ExportService
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = new AdminDashboardViewModel();
  }

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      this.viewModel.loading = true;
      this._commonService.presentLoading();
      
      const response = await this.dashboardService.getDashboardData(
        this.dateFilter,
        this.dateFilter === 'custom' ? this.startDate : undefined,
        this.dateFilter === 'custom' ? this.endDate : undefined
      );
      
      if (response.isError) {
        this.viewModel.error = response.errorData?.displayMessage || 'Failed to load dashboard data';
        await this._logHandler.logObject(response.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: this.viewModel.error,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      if (response.successData) {
        this.viewModel.dashboardData = response.successData;
        this.mapDashboardData();
      }
    } catch (error: any) {
      this.viewModel.error = error.message || 'An error occurred';
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: this.viewModel.error,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      this.viewModel.loading = false;
      this._commonService.dismissLoader();
    }
  }

  mapDashboardData() {
    if (!this.viewModel.dashboardData) return;

    const data = this.viewModel.dashboardData;

    // Map KPIs
    if (data.kpis) {
      this.viewModel.totalSales = data.kpis.totalSales || '₹0';
      this.viewModel.totalOrders = data.kpis.totalOrders || 0;
      this.viewModel.activeUsers = data.kpis.activeUsers || 0;
      this.viewModel.totalCustomers = data.kpis.totalCustomers || 0;
      this.viewModel.returnRate = data.kpis.returnRate || '0%';
      this.viewModel.todaySales = data.kpis.todaySales || '₹0';
      this.viewModel.todayOrders = data.kpis.todayOrders || 0;
      this.viewModel.thisMonthSales = data.kpis.thisMonthSales || '₹0';
      this.viewModel.thisMonthOrders = data.kpis.thisMonthOrders || 0;
      this.viewModel.pendingOrders = data.kpis.pendingOrders || 0;
      this.viewModel.productsSold = data.kpis.productsSold || 0;
      this.viewModel.lowStockProducts = data.kpis.lowStockProducts || 0;
    }

    // Map Monthly Sales Chart
    if (data.charts?.monthlySales) {
      this.viewModel.monthlySalesLabels = data.charts.monthlySales.labels || [];
      this.viewModel.monthlySalesData = data.charts.monthlySales.data || [];
      this.viewModel.monthlySalesOrders = data.charts.monthlySales.orders || [];
    }

    // Map Category Sales Chart
    if (data.charts?.categorySales) {
      this.viewModel.categorySalesLabels = data.charts.categorySales.labels || [];
      this.viewModel.categorySalesData = data.charts.categorySales.data || [];
      this.viewModel.categorySalesPercentages = data.charts.categorySales.percentages || [];
    }

    // Map Daily Visitors
    if (data.charts?.dailyVisitors) {
      this.viewModel.dailyVisitors = data.charts.dailyVisitors;
    }
    
    // Map Daily Visitors Notification
    if (data.charts?.dailyVisitorsNotification) {
      this.viewModel.dailyVisitorsNotification = data.charts.dailyVisitorsNotification;
    }

    // Map Widgets
    if (data.widgets) {
      this.viewModel.recentOrders = data.widgets.recentOrders || [];
      this.viewModel.topProducts = data.widgets.topProducts || [];
    }
  }

  // KPI Data (exposed for template)
  get totalSales() { return this.viewModel.totalSales; }
  get totalOrders() { return this.viewModel.totalOrders; }
  get totalCustomers() { return this.viewModel.totalCustomers; }
  get activeUsers() { return this.viewModel.activeUsers; }
  get returnRate() { return this.viewModel.returnRate; }
  get todaySales() { return this.viewModel.todaySales || '₹0'; }
  get todayOrders() { return this.viewModel.todayOrders || 0; }
  get thisMonthSales() { return this.viewModel.thisMonthSales || '₹0'; }
  get thisMonthOrders() { return this.viewModel.thisMonthOrders || 0; }

  // Additional Quick Insights
  dateFilter: 'today' | 'week' | 'month' | 'year' | 'custom' = 'year';
  startDate: string = '';
  endDate: string = '';

  get pendingOrders() { return this.viewModel.pendingOrders || 0; }
  get avgOrderValue() {
    const sales = parseFloat((this.viewModel.totalSales || '0').replace(/[^0-9.]/g, ''));
    const orders = this.viewModel.totalOrders || 0;
    if (!orders) return '₹0';
    return '₹' + Math.round(sales / orders).toLocaleString();
  }
  get todayAvgOrderValue() {
    const sales = parseFloat((this.viewModel.todaySales || '0').replace(/[^0-9.]/g, ''));
    const orders = this.viewModel.todayOrders || 0;
    if (!orders) return '₹0';
    return '₹' + Math.round(sales / orders).toLocaleString();
  }
  get monthAvgOrderValue() {
    const sales = parseFloat((this.viewModel.thisMonthSales || '0').replace(/[^0-9.]/g, ''));
    const orders = this.viewModel.thisMonthOrders || 0;
    if (!orders) return '₹0';
    return '₹' + Math.round(sales / orders).toLocaleString();
  }
  get productsSold() { return this.viewModel.productsSold || 0; }
  get lowStockProducts() { return this.viewModel.lowStockProducts || 0; }

  // Date Filter Method
  setDateFilter(filter: 'today' | 'week' | 'month' | 'year' | 'custom') {
    this.dateFilter = filter;
    // Set default dates for custom range if not set
    if (filter === 'custom') {
      if (!this.startDate) {
        const today = new Date();
        this.endDate = today.toISOString().split('T')[0];
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        this.startDate = lastMonth.toISOString().split('T')[0];
      }
    }
    // Reload dashboard data with new filter
    this.loadDashboardData();
  }

  // Handle custom date range change
  onDateRangeChange() {
    if (this.startDate && this.endDate) {
      this.dateFilter = 'custom';
      this.loadDashboardData();
    }
  }

  // Open date picker
  openDatePicker(inputId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      if (input.showPicker) {
        input.showPicker();
      } else {
        input.click();
      }
      input.focus();
    }
  }

  // Navigate to orders with status filter
  navigateToOrders(status?: string) {
    const queryParams = status ? `?status=${status}` : '';
    window.location.href = `/admin/order${queryParams}`;
  }

  // Navigate to products with low stock filter
  navigateToLowStock() {
    window.location.href = '/admin/product-list?filter=low-stock';
  }

  // Refresh dashboard data
  async refreshDashboard() {
    await this.loadDashboardData();
    this._commonService.showSweetAlertToast({
      title: 'Success',
      text: 'Dashboard data refreshed',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  }

  // View order details
  viewOrderDetails(orderId: number) {
    window.location.href = `/admin/order/${orderId}`;
  }

  // Monthly Sales Bar Chart
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: {
        grid: { display: false },
        ticks: { color: '#6c757d', font: { size: 12 } }
      }, 
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#6c757d', font: { size: 12 } }
      } 
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: { 
          usePointStyle: true,
          padding: 15,
          font: { size: 12, weight: '500' },
          color: '#495057'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        cornerRadius: 8
      }
    }
  };
  public barChartType: ChartType = 'bar';
  get barChartData(): ChartConfiguration<'bar'>['data'] {
    return {
      labels: this.viewModel.monthlySalesLabels,
      datasets: [
        { 
          data: this.viewModel.monthlySalesData, 
          label: 'Sales (₹)',
          backgroundColor: '#4e73df'
        },
        {
          data: this.viewModel.monthlySalesOrders,
          label: 'Orders',
          backgroundColor: '#1cc88a'
        }
      ]
    };
  }

  // Product Category Pie Chart
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { size: 11, weight: '500' },
          color: '#495057'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };
  public pieChartType: ChartType = 'pie';
  get pieChartData(): ChartConfiguration<'pie'>['data'] {
    const colors = [
      'rgba(102, 126, 234, 0.9)',   // Primary blue
      'rgba(17, 153, 142, 0.9)',     // Success green
      'rgba(52, 148, 230, 0.9)',     // Info blue
      'rgba(240, 147, 251, 0.9)',    // Warning pink
      'rgba(250, 112, 154, 0.9)',    // Danger pink
      'rgba(133, 135, 150, 0.9)',    // Gray
      'rgba(90, 92, 105, 0.9)'       // Dark gray
    ];
    return {
      labels: this.viewModel.categorySalesLabels,
      datasets: [{
        data: this.viewModel.categorySalesData,
        backgroundColor: colors.slice(0, this.viewModel.categorySalesLabels.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  // Daily Visitors Line Chart
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        display: true,
        grid: { display: false },
        ticks: { color: '#6c757d', font: { size: 11 }, maxRotation: 45, minRotation: 45 }
      },
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#6c757d', font: { size: 11 } }
      }
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12, weight: '500' },
          color: '#495057'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        cornerRadius: 8
      }
    }
  };
  public lineChartType: ChartType = 'line';
  get lineChartData(): ChartConfiguration<'line'>['data'] {
    return {
      labels: this.viewModel.dailyVisitors.map(v => v.date),
      datasets: [
        {
          label: 'Website Visitors',
          data: this.viewModel.dailyVisitors.map(v => v.visitors),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }
      ]
    };
  }

  // Widget Data
  get recentOrders() { return this.viewModel.recentOrders; }
  get topProducts() { return this.viewModel.topProducts; }
  
  // Format order display
  formatOrder(order: any): string {
    return `Order #${order.orderNumber || order.id} - ${order.amount ? '₹' + order.amount : ''} - ${order.status || ''}`;
  }

  // Format product display
  formatProduct(product: any): string {
    return `${product.productName || product.name} (${product.totalQuantity || 0} sold)`;
  }

  // Format date for display
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  exportToPDF() {
    if (!this.viewModel.dashboardData) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'No dashboard data available to export',
        icon: 'error'
      });
      return;
    }
    this.exportService.exportDashboardToPDF(this.viewModel.dashboardData, 'dashboard_report');
  }

  exportToExcel() {
    if (!this.viewModel.dashboardData) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'No dashboard data available to export',
        icon: 'error'
      });
      return;
    }
    this.exportService.exportDashboardToExcel(this.viewModel.dashboardData, 'dashboard_report');
  }
}

