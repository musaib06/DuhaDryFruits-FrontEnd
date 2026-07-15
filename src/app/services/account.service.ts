import { Injectable } from '@angular/core';
import { AccountsClient } from '../clients/accounts.client';
import { BaseService } from './base.service';
import { StorageService } from './storage.service';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { Router } from '@angular/router';
import { AppConstants } from '../../app-constants';
import { UserSM } from '../models/service-models/app/v1/app-users/register/user-s-m';
import { loginUserDetails } from '../models/view/auth-viewModels/auth.viewmodel';


@Injectable({
  providedIn: 'root'
})
export class AccountService extends BaseService {

  constructor(private accountClient: AccountsClient, private storageService: StorageService,private router:Router) {
    super();
  }

/**
 * @Musaib
 * Post login Credenuials
 * @param tokenReq
 * @param rememberUser 
 * @returns  Token
 */
  async generateToken(tokenReq: loginUserDetails, rememberUser: boolean): Promise<ApiResponse<UserSM>> {
    if (!tokenReq || !tokenReq.username)// null checks
    {
      throw new Error(AppConstants.ErrorPrompts.Invalid_Input_Data);
    }
    else {
      let apiRequest = new ApiRequest<loginUserDetails>();
      apiRequest.reqData = tokenReq;
      let resp =await this.accountClient.GenerateToken(apiRequest);
      // let resp = this.getDummyTokenResp(tokenReq);
      if (!resp.isError && resp.successData != null) {
        this.storageService.saveToStorage(AppConstants.DbKeys.REMEMBER_ME, rememberUser);
        if (rememberUser) {
          this.storageService.saveToStorage(AppConstants.DbKeys.ACCESS_TOKEN, resp.successData.accessToken);
          this.storageService.saveToStorage(AppConstants.DbKeys.LOGIN_USER, resp.successData);
          // this.storageService.saveToStorage(AppConstants.DbKeys.COMPANY_CODE, tokenReq.companyCode);
        }
        else {
          this.storageService.saveToSessionStorage(AppConstants.DbKeys.ACCESS_TOKEN, resp.successData.accessToken);
          this.storageService.saveToSessionStorage(AppConstants.DbKeys.LOGIN_USER, resp.successData);
          // this.storageService.saveToSessionStorage(AppConstants.DbKeys.COMPANY_CODE, tokenReq.companyCode);
        }
      }
      return resp;
    }
  }


/**
 * Get Token from localStorage
 * @returns
 */
  async getTokenFromStorage(): Promise<string> {
    let remMe: boolean = await this.storageService.getFromStorage(
      AppConstants.DbKeys.REMEMBER_ME
    );
    if (remMe && remMe == true)
      return await this.storageService.getFromStorage(
        AppConstants.DbKeys.ACCESS_TOKEN
      );
    return await this.storageService.getFromSessionStorage(
      AppConstants.DbKeys.ACCESS_TOKEN
    );
  }
/**
 * Register New User
 * @param user
 * @returns 
//  */
  async RegisterNewUser(user:UserSM): Promise<ApiResponse<UserSM>> {
    let apiRequest = new ApiRequest<UserSM>();
    apiRequest.reqData =user;
    return await this.accountClient.RegisterNewUser(apiRequest);
  }

/**
 * Logout Use
 *  Clear all data in the local storage and redirect to login page
 */
  async logoutUser() {
    try {
      this.storageService.removeFromSessionStorage(AppConstants.DbKeys.ACCESS_TOKEN);
      this.storageService.removeFromSessionStorage(AppConstants.DbKeys.LOGIN_USER);
      // this.storageService.removeFromSessionStorage(AppConstants.DbKeys.COMPANY_CODE);
      this.storageService.removeFromSessionStorage(AppConstants.DbKeys.REMEMBER_ME);
      this.router.navigate(["login"]);
    }
    catch (err) {
      this.storageService.clearSessionStorage();
    }
    try {
      this.storageService.removeFromStorage(AppConstants.DbKeys.ACCESS_TOKEN);
      this.storageService.removeFromStorage(AppConstants.DbKeys.LOGIN_USER);
      // this.storageService.removeFromStorage(AppConstants.DbKeys.COMPANY_CODE);
      this.storageService.removeFromStorage(AppConstants.DbKeys.REMEMBER_ME);
      this.router.navigate(["login"]);
    } catch (error) {
      this.storageService.clearStorage();
    }
  }
}
