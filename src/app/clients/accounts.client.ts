import { Injectable } from '@angular/core';
import {
  AdditionalRequestDetails,
  Authentication,
} from '../models/internal/additional-request-details';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { StorageService } from '../services/storage.service';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { AppConstants } from '../../app-constants';
import { UserSM } from '../models/service-models/app/v1/app-users/register/user-s-m';
import { loginUserDetails } from '../models/view/auth-viewModels/auth.viewmodel';

@Injectable({
  providedIn: 'root',
})
export class AccountsClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }
  /**
   * @Dev Musaib
   * Login
   * @param tokenRequestSM
   * @returns
   */
  GenerateToken = async (
    tokenRequestSM: ApiRequest<loginUserDetails>
  ): Promise<ApiResponse<UserSM>> => {
    let resp = await this.GetResponseAsync<loginUserDetails, UserSM>(
      `${AppConstants.ApiUrls.LOG_URL}`,
      'POST',
      tokenRequestSM,
      new AdditionalRequestDetails<UserSM>(false, Authentication.false)
    );
    return resp;
  };
  /**
   * @Musaib
   * Sign-Up
   * @param addUser
   * @returns
   */
  RegisterNewUser= async (addUser: ApiRequest<UserSM>): Promise<ApiResponse<UserSM>> => {
      let resp = await this.GetResponseAsync<UserSM,UserSM>(`${AppConstants.ApiUrls.REGISTER_URL}`, "POST", addUser,
      new AdditionalRequestDetails<UserSM>(false, Authentication.false));
      return resp;
    };
}
