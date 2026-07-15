import { Injectable } from '@angular/core';

import { AccountsClient } from '../clients/accounts.client';
import { BaseService } from './base.service';
import { TokenRequestSM } from '../models/service-models/app/token/token-request-s-m';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { TokenResponseSM } from '../models/service-models/app/token/token-response-s-m';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { RoleTypeSM } from '../models/service-models/app/enums/role-type-s-m.enum';
import { AppConstants } from '../../app-constants';

@Injectable({
  providedIn: 'root',
})
export class SampleService extends BaseService {
  constructor(private accountClient: AccountsClient) {
    super();
  }

  async generateToken(
    tokenReq: TokenRequestSM
  ) {
    // if (tokenReq == null || tokenReq.loginId == null) {
    //   // null checks
    //   throw new Error(AppConstants.ErrorPrompts.Invalid_Input_Data);
    // } else {
    //   let apiRequest = new ApiRequest<TokenRequestSM>();
    //   // tokenReq.companyCode = '123';
    //   tokenReq.roleType = RoleTypeSM.CompanyAdmin;
    //   apiRequest.reqData = tokenReq;
    //   return await this.accountClient.GenerateToken(apiRequest);
    // }
  }
}
