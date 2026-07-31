import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { BannerClient } from '../clients/banner.client';
import { BannerViewModel } from '../models/view/website-resource/banner.viewmodel';
import { BannerSM } from '../models/service-models/app/v1/website-resource/banner-s-m';
import { AppConstants } from '../../app-constants';
import { SsrTransferService } from './ssr-transfer.service';
import { SSR_TRANSFER_KEYS } from './ssr-transfer.keys';

@Injectable({
  providedIn: 'root',
})
export class BannerService extends BaseService {
  private readonly CACHE_TTL_MS = 5 * 60_000;
  private bannersCache: { at: number; data: ApiResponse<BannerSM[]> } | null = null;
  private bannersInflight: Promise<ApiResponse<BannerSM[]>> | null = null;

  constructor(
    private BannerClient: BannerClient,
    private ssrTransfer: SsrTransferService,
  ) {
    super();
  }

  /** Cached homepage banners — avoids duplicate SSR + client fetches. */
  async getStorefrontBanners(viewModel: BannerViewModel): Promise<ApiResponse<BannerSM[]>> {
    if (this.bannersCache && Date.now() - this.bannersCache.at < this.CACHE_TTL_MS) {
      return this.bannersCache.data;
    }
    if (this.bannersInflight) {
      return this.bannersInflight;
    }
    this.bannersInflight = this.ssrTransfer
      .hydrateOrFetch(
        SSR_TRANSFER_KEYS.STOREFRONT_BANNERS,
        () => this.getAllBanners(viewModel),
        (resp) => {
          if (!resp.isError) {
            this.bannersCache = { at: Date.now(), data: resp };
          }
        },
      )
      .finally(() => {
        this.bannersInflight = null;
      });
    return this.bannersInflight;
  }

  /**
   * Retrieves all Banners from the server.
   *
   * @returns A promise that resolves to an ApiResponse containing an array of BannerSM objects.
   *
   * @throws Will throw an error if the server request fails.
   */
  async getAllBanners(
    viewModel: BannerViewModel
  ): Promise<ApiResponse<BannerSM[]>> {
    let queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    return await this.BannerClient.GetAllBanners(queryFilter);
  }

  /** Admin list — full uncached list so new uploads always appear. */
  async getAdminBanners(): Promise<ApiResponse<BannerSM[]>> {
    this.clearBannersCache();
    return await this.BannerClient.GetAllBannersUnpaginated();
  }

  clearBannersCache(): void {
    this.bannersCache = null;
  }

  async getTotalBannersCount(): Promise<ApiResponse<IntResponseRoot>> {
    return await this.BannerClient.GetTotatBannerCount();
  }
  async deleteBanner(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    this.clearBannersCache();
    return await this.BannerClient.DeleteBannerById(id);
  }

  async getBannerById(id: number): Promise<ApiResponse<BannerSM>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.BannerClient.GetBannerById(id);
  }


async addBanner(formData: FormData): Promise<ApiResponse<BannerSM>> {
  let apiRequest = formData; // direct pass
  this.clearBannersCache();
  return await this.BannerClient.AddBanner(apiRequest);
}
async updateBanner(formData: FormData, id: number): Promise<ApiResponse<BannerSM>> {
  let apiRequest = formData; // direct pass
  this.clearBannersCache();
  return await this.BannerClient.UpdateBanner(apiRequest, id);
}
}
