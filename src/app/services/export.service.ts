import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export data to PDF
   */
  exportToPDF(data: any[], columns: { header: string; dataKey: string }[], title: string, filename: string = 'export'): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
    
    // Prepare table data
    const tableData = data.map(item => 
      columns.map(col => {
        const value = this.getNestedValue(item, col.dataKey);
        return value !== null && value !== undefined ? String(value) : '';
      })
    );

    const tableHeaders = columns.map(col => col.header);

    // Add table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 35 }
    });

    // Save PDF
    doc.save(`${filename}_${new Date().getTime()}.pdf`);
  }

  /**
   * Export data to Excel
   */
  exportToExcel(data: any[], columns: { header: string; dataKey: string }[], filename: string = 'export'): void {
    // Prepare worksheet data
    const worksheetData = [
      columns.map(col => col.header), // Header row
      ...data.map(item => 
        columns.map(col => {
          const value = this.getNestedValue(item, col.dataKey);
          return value !== null && value !== undefined ? value : '';
        })
      )
    ];

    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Set column widths
    const colWidths = columns.map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;

    // Save Excel file
    XLSX.writeFile(workbook, `${filename}_${new Date().getTime()}.xlsx`);
  }

  /**
   * Export dashboard data to PDF
   */
  exportDashboardToPDF(dashboardData: any, filename: string = 'dashboard_report'): void {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Dashboard Report', 14, 20);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 14, 28);

    let startY = 40;

    // KPIs Section
    if (dashboardData.kpis) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Key Performance Indicators', 14, startY);
      startY += 10;

      const kpiData = [
        ['Metric', 'Value'],
        ['Total Sales', dashboardData.kpis.totalSales || '₹0'],
        ['Total Orders', dashboardData.kpis.totalOrders || 0],
        ['Total Customers', dashboardData.kpis.totalCustomers || 0],
        ['Active Users', dashboardData.kpis.activeUsers || 0],
        ['Return Rate', dashboardData.kpis.returnRate || '0%']
      ];

      autoTable(doc, {
        body: kpiData,
        startY: startY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { top: startY }
      });

      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Recent Orders Section
    if (dashboardData.widgets?.recentOrders && dashboardData.widgets.recentOrders.length > 0) {
      doc.setFontSize(14);
      doc.text('Recent Orders', 14, startY);
      startY += 10;

      const ordersData = [
        ['Order ID', 'Customer', 'Amount', 'Status'],
        ...dashboardData.widgets.recentOrders.slice(0, 10).map((order: any) => [
          order.orderNumber || order.id || 'N/A',
          order.customerName || 'N/A',
          `₹${order.amount || 0}`,
          order.status || 'N/A'
        ])
      ];

      autoTable(doc, {
        body: ordersData,
        startY: startY,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { top: startY }
      });

      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Top Products Section
    if (dashboardData.widgets?.topProducts && dashboardData.widgets.topProducts.length > 0) {
      doc.setFontSize(14);
      doc.text('Top Products', 14, startY);
      startY += 10;

      const productsData = [
        ['Product', 'SKU', 'Quantity Sold', 'Revenue'],
        ...dashboardData.widgets.topProducts.slice(0, 10).map((product: any) => [
          product.productName || 'N/A',
          product.sku || 'N/A',
          product.totalQuantity || 0,
          `₹${product.totalRevenue || 0}`
        ])
      ];

      autoTable(doc, {
        body: productsData,
        startY: startY,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { top: startY }
      });
    }

    doc.save(`${filename}_${new Date().getTime()}.pdf`);
  }

  /**
   * Export dashboard data to Excel
   */
  exportDashboardToExcel(dashboardData: any, filename: string = 'dashboard_report'): void {
    const workbook = XLSX.utils.book_new();

    // KPIs Sheet
    if (dashboardData.kpis) {
      const kpiData = [
        ['Metric', 'Value'],
        ['Total Sales', dashboardData.kpis.totalSales || '₹0'],
        ['Total Orders', dashboardData.kpis.totalOrders || 0],
        ['Total Customers', dashboardData.kpis.totalCustomers || 0],
        ['Active Users', dashboardData.kpis.activeUsers || 0],
        ['Return Rate', dashboardData.kpis.returnRate || '0%']
      ];
      const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');
    }

    // Recent Orders Sheet
    if (dashboardData.widgets?.recentOrders && dashboardData.widgets.recentOrders.length > 0) {
      const ordersData = [
        ['Order ID', 'Customer', 'Amount', 'Status', 'Date'],
        ...dashboardData.widgets.recentOrders.map((order: any) => [
          order.orderNumber || order.id || 'N/A',
          order.customerName || 'N/A',
          order.amount || 0,
          order.status || 'N/A',
          order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'
        ])
      ];
      const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
      XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Recent Orders');
    }

    // Top Products Sheet
    if (dashboardData.widgets?.topProducts && dashboardData.widgets.topProducts.length > 0) {
      const productsData = [
        ['Product', 'SKU', 'Quantity Sold', 'Revenue'],
        ...dashboardData.widgets.topProducts.map((product: any) => [
          product.productName || 'N/A',
          product.sku || 'N/A',
          product.totalQuantity || 0,
          product.totalRevenue || 0
        ])
      ];
      const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Products');
    }

    XLSX.writeFile(workbook, `${filename}_${new Date().getTime()}.xlsx`);
  }

  /**
   * Helper to get nested object values
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : null;
    }, obj);
  }
}

