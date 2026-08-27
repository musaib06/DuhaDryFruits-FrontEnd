import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { PartnerRevenueClient } from '../clients/partner-revenue.client';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { PartnerSM } from '../models/service-models/app/v1/partner-revenue-s-m';

@Injectable({ providedIn: 'root' })
export class PartnerRevenueService extends BaseService {
  constructor(private client: PartnerRevenueClient) {
    super();
  }

  getMeta() {
    return this.client.GetMeta();
  }
  getPartners(params: Record<string, string | number | undefined> = {}) {
    return this.client.GetPartners(params);
  }
  getPartner(id: number) {
    return this.client.GetPartner(id);
  }
  createPartner(payload: Record<string, unknown>): Promise<ApiResponse<PartnerSM>> {
    return this.client.CreatePartner(payload);
  }
  updatePartner(id: number, payload: Record<string, unknown>) {
    return this.client.UpdatePartner(id, payload);
  }
  changePercentage(id: number, payload: Record<string, unknown>) {
    return this.client.ChangePercentage(id, payload);
  }
  getPercentageHistory(params: Record<string, string | number | undefined> = {}) {
    return this.client.GetPercentageHistory(params);
  }
  getDashboard(partnerId?: number) {
    return this.client.GetDashboard(partnerId);
  }
  getDailyRevenue(params: Record<string, string | number | undefined> = {}) {
    return this.client.GetDailyRevenue(params);
  }
  getMonthlyRevenue(params: Record<string, string | number | undefined> = {}) {
    return this.client.GetMonthlyRevenue(params);
  }
  getDrilldown(params: Record<string, string | number | undefined> = {}) {
    return this.client.GetDrilldown(params);
  }
  getSettlements(params: Record<string, string | number | undefined> = {}) {
    return this.client.GetSettlements(params);
  }
  recordSettlement(payload: Record<string, unknown>) {
    return this.client.RecordSettlement(payload);
  }
  reverseSettlement(id: number, payload: Record<string, unknown>) {
    return this.client.ReverseSettlement(id, payload);
  }
  getLedger(params: Record<string, string | number | undefined> = {}) {
    return this.client.GetLedger(params);
  }
  getStatement(params: Record<string, string | number | undefined> = {}) {
    return this.client.GetStatement(params);
  }

  formatInr(n: number | string | null | undefined): string {
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
