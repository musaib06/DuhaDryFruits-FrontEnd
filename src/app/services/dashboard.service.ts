import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { DashboardClient } from '../clients/dashboard.client';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DashboardSM } from '../models/service-models/app/v1/dashboard-s-m';

@Injectable({
  providedIn: 'root',
})
export class DashboardService extends BaseService {
  constructor(private dashboardClient: DashboardClient) {
    super();
  }

  /**
   * Get Admin Dashboard Data
   * Returns comprehensive dashboard data including KPIs, charts, and widgets
   */
  async getDashboardData(
    dateFilter?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<DashboardSM>> {
    return await this.dashboardClient.GetDashboardData(dateFilter, startDate, endDate);
  }
}
