import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { AppConstants } from '../../app-constants';
import {
  AdditionalRequestDetails,
  Authentication,
} from '../models/internal/additional-request-details';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import {
  PartnerSM,
  PartnerDashboardSM,
  PartnerDailyRowSM,
  PartnerMonthlyRowSM,
  PartnerSettlementSM,
  PartnerPercentageHistorySM,
  PartnerLedgerEntrySM,
  PartnerMetaSM,
} from '../models/service-models/app/v1/partner-revenue-s-m';

@Injectable({ providedIn: 'root' })
export class PartnerRevenueClient extends BaseApiClient {
  private readonly base = `${AppConstants.ApiUrls.BASE}/partner-revenue`;

  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  private auth<T>() {
    return new AdditionalRequestDetails<T>(false, Authentication.true);
  }

  private qs(params: Record<string, string | number | undefined | null> = {}): string {
    const parts = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    return parts.length ? `?${parts.join('&')}` : '';
  }

  GetMeta = () => this.GetResponseAsync<null, PartnerMetaSM>(`${this.base}/meta`, 'GET', null, this.auth());

  GetPartners = (params: Record<string, string | number | undefined> = {}) =>
    this.GetResponseAsync<null, PartnerSM[]>(`${this.base}/partners${this.qs(params)}`, 'GET', null, this.auth());

  GetPartner = (id: number) =>
    this.GetResponseAsync<null, PartnerSM>(`${this.base}/partners/${id}`, 'GET', null, this.auth());

  CreatePartner = (payload: Record<string, unknown>) => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = payload;
    return this.GetResponseAsync<ApiRequest<Record<string, unknown>>, PartnerSM>(
      `${this.base}/partners`,
      'POST',
      apiRequest,
      this.auth()
    );
  };

  UpdatePartner = (id: number, payload: Record<string, unknown>) => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = payload;
    return this.GetResponseAsync<ApiRequest<Record<string, unknown>>, PartnerSM>(
      `${this.base}/partners/${id}`,
      'PUT',
      apiRequest,
      this.auth()
    );
  };

  ChangePercentage = (id: number, payload: Record<string, unknown>) => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = payload;
    return this.GetResponseAsync<ApiRequest<Record<string, unknown>>, PartnerSM>(
      `${this.base}/partners/${id}/percentage`,
      'POST',
      apiRequest,
      this.auth()
    );
  };

  GetPercentageHistory = (params: Record<string, string | number | undefined> = {}) =>
    this.GetResponseAsync<null, PartnerPercentageHistorySM[]>(
      `${this.base}/percentage-history${this.qs(params)}`,
      'GET',
      null,
      this.auth()
    );

  GetDashboard = (partnerId?: number) =>
    this.GetResponseAsync<null, PartnerDashboardSM>(
      `${this.base}/dashboard${this.qs({ partnerId })}`,
      'GET',
      null,
      this.auth()
    );

  GetDailyRevenue = (params: Record<string, string | number | undefined> = {}) =>
    this.GetResponseAsync<null, { partner: PartnerSM | null; rows: PartnerDailyRowSM[]; totals: Record<string, number> }>(
      `${this.base}/revenue/daily${this.qs(params)}`,
      'GET',
      null,
      this.auth()
    );

  GetMonthlyRevenue = (params: Record<string, string | number | undefined> = {}) =>
    this.GetResponseAsync<null, { partner: PartnerSM | null; rows: PartnerMonthlyRowSM[] }>(
      `${this.base}/revenue/monthly${this.qs(params)}`,
      'GET',
      null,
      this.auth()
    );

  GetDrilldown = (params: Record<string, string | number | undefined> = {}) =>
    this.GetResponseAsync<null, Record<string, unknown>>(
      `${this.base}/revenue/drilldown${this.qs(params)}`,
      'GET',
      null,
      this.auth()
    );

  GetSettlements = (params: Record<string, string | number | undefined> = {}) =>
    this.GetResponseAsync<null, { items: PartnerSettlementSM[]; total: number }>(
      `${this.base}/settlements${this.qs(params)}`,
      'GET',
      null,
      this.auth()
    );

  RecordSettlement = (payload: Record<string, unknown>) => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = payload;
    return this.GetResponseAsync<ApiRequest<Record<string, unknown>>, PartnerSettlementSM>(
      `${this.base}/settlements`,
      'POST',
      apiRequest,
      this.auth()
    );
  };

  ReverseSettlement = (id: number, payload: Record<string, unknown>) => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = payload;
    return this.GetResponseAsync<ApiRequest<Record<string, unknown>>, PartnerSettlementSM>(
      `${this.base}/settlements/${id}/reverse`,
      'POST',
      apiRequest,
      this.auth()
    );
  };

  GetLedger = (params: Record<string, string | number | undefined> = {}) =>
    this.GetResponseAsync<null, { partner: PartnerSM; entries: PartnerLedgerEntrySM[] }>(
      `${this.base}/ledger${this.qs(params)}`,
      'GET',
      null,
      this.auth()
    );

  GetStatement = (params: Record<string, string | number | undefined> = {}) =>
    this.GetResponseAsync<null, Record<string, unknown>>(
      `${this.base}/statement${this.qs(params)}`,
      'GET',
      null,
      this.auth()
    );
}
