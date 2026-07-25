import axios, { AxiosResponse, Method } from 'axios';
import { AdditionalRequestDetails, Authentication } from '../../models/internal/additional-request-details';
import { BaseAjaxClient } from './base-ajax.client';
import { CommonResponseCodeHandler } from '../helpers/common-response-code-handler.helper';
import { CommonUtils } from '../helpers/common-utils.helper';
import { StorageService } from '../../services/storage.service';
import { StorageCache } from '../helpers/storage-cache.helper';
import { ApiResponse } from '../../models/service-models/foundation/api-contracts/base/api-response';
import { ApiRequest } from '../../models/service-models/foundation/api-contracts/base/api-request';
import { IDictionaryCollection } from '../../models/internal/Idictionary-collection';
import { DictionaryCollection } from '../../models/internal/dictionary-collection';
import { ErrorData } from '../../models/service-models/foundation/api-contracts/error-data';
import { ApiErrorTypeSM } from '../../models/service-models/foundation/enums/api-error-type-s-m.enum';
import { QueryFilter } from '../../models/service-models/foundation/api-contracts/query-filter';
import { AppConstants } from '../../../app-constants';
import { environment } from '../../../environments/environment';

export abstract class BaseApiClient extends BaseAjaxClient {
  constructor(
    protected storageservice: StorageService,
    protected storageCacheHelper: StorageCache,
    private commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super();
  }

  protected GetResponseAsync = async <InReq, OutResp>(
  relativeUrl: string,
  reqMethod: Method = 'GET',
  reqBody: InReq | ApiRequest<InReq> | FormData | null = null,
  additionalRequestDetails: AdditionalRequestDetails<OutResp> = new AdditionalRequestDetails<OutResp>(false)
  ): Promise<ApiResponse<OutResp>> => {
    let responseEntity: ApiResponse<OutResp> | null = null;
    let axiosResp: AxiosResponse<any> | null = null;

    if (additionalRequestDetails == null)
      throw new Error('AdditionalRequestDetails cannot be null, do not pass if not required.');

    try {
      const fullUrlToHit = CommonUtils.CombineUrl(environment.apiBaseUrl, relativeUrl);

      responseEntity = await this.storageCacheHelper.GetResponseFromDbIfPresent<OutResp>(
        fullUrlToHit,
        reqMethod,
        additionalRequestDetails
      );
      if (responseEntity != null) return responseEntity;

      // Add headers
      additionalRequestDetails.headers = await this.AddCommonHeaders(additionalRequestDetails.headers);

      // Handle auth
      if (additionalRequestDetails.enableAuth === Authentication.true) {
        let token: string = await this.storageservice.getDataFromAnyStorage(AppConstants.DbKeys.ACCESS_TOKEN);
        if (!token) throw new Error(`Token not found for URL - '${relativeUrl}'.`);
        additionalRequestDetails.headers.Add('Authorization', 'Bearer ' + token);
      }

      // Special case: FormData → remove content-type, let axios handle
      if (reqBody instanceof FormData) {
        additionalRequestDetails.headers.Remove('Content-Type');
      }

      axiosResp = await this.GetHttpDataAsync<any>(
        fullUrlToHit,
        reqMethod,
        reqBody,
        additionalRequestDetails.headers,
        additionalRequestDetails.contentType
      );

      // Handle common response codes
      if (this.commonResponseCodeHandler.handlerDict.Keys().includes(axiosResp.status.toString())) {
        let errMessage = this.commonResponseCodeHandler.handlerDict.Item(axiosResp.status.toString())(axiosResp);
        return this.CreateGenericApiResponseObject(errMessage);
      }

      responseEntity = await this.CreateResponseEntityFromAxiosResp<OutResp>(
        axiosResp,
        additionalRequestDetails.custRespResolver
      );
      if (responseEntity == null) {
        console.error('[BaseApiClient] Response entity is null. Axios response:', axiosResp);
        throw new Error('Null Response Formed.');
      }

      // Cache response
      await this.storageCacheHelper.AddOrUpdateResponseInCacheIfApplicable<OutResp>(
        fullUrlToHit,
        reqMethod,
        additionalRequestDetails,
        responseEntity
      );

      return responseEntity;
    } catch (x) {
      let msg = x instanceof Error ? x.message : JSON.stringify(x);
      if (msg === 'Network Error') {
        msg = AppConstants.ErrorPrompts.Network_Error;
      }
      if (axios.isAxiosError(x) && (x.code === 'ECONNABORTED' || x.code === 'ETIMEDOUT')) {
        msg = AppConstants.ErrorPrompts.Network_Error;
      }
      const resp = this.CreateGenericApiResponseObject<OutResp>(msg);
      resp.axiosResponse = axiosResp;
      return resp;
    }
  };

  private CreateResponseEntityFromAxiosResp = async <OutResp>(
    axiosResp: AxiosResponse,
    respResolver: ((resp: AxiosResponse) => ApiResponse<OutResp>) | null
  ): Promise<ApiResponse<OutResp> | null> => {
    let retObject: ApiResponse<OutResp> | null = null;

    try {
      if (this.IsSuccessCode(axiosResp.status)) {
        if (respResolver != null) {
          const data = respResolver(axiosResp);
          data.axiosResponse = axiosResp;
          retObject = data;
        } else {
          // Ensure data is an object, not a string
          if (typeof axiosResp.data === 'string') {
            console.error('[BaseApiClient] Response data is a string, expected object:', axiosResp.data.substring(0, 200));
            throw new Error('Response data is a string instead of parsed JSON object');
          }
          const data = axiosResp.data as ApiResponse<OutResp>;
          data.axiosResponse = axiosResp;
          retObject = data;
        }
      } else {
        if (axiosResp.data != null && typeof axiosResp.data === 'object' && axiosResp.data.isError !== undefined) {
          retObject = axiosResp.data as ApiResponse<OutResp>;
          retObject.axiosResponse = axiosResp;
        }
      }

      if (retObject == null) {
        retObject = this.CreateGenericApiResponseObject<OutResp>(
          `Unknown error occurred - status code '${axiosResp.status}'`
        );
        retObject!.axiosResponse = axiosResp;
      }
    } catch (err: any) {
      console.error('[BaseApiClient] Error creating response entity:', err);
      console.error('[BaseApiClient] Axios response status:', axiosResp.status);
      console.error('[BaseApiClient] Axios response data type:', typeof axiosResp.data);
      console.error('[BaseApiClient] Axios response data:', axiosResp.data);
      throw err;
    }
    
    return retObject;
  };

  protected CreateGenericApiResponseObject = <OutResp>(addMsg: string): ApiResponse<OutResp> => {
    const resp = new ApiResponse<OutResp>();
    resp.isError = true;
    resp.errorData = new ErrorData();
    resp.errorData.displayMessage = addMsg;
    resp.errorData.apiErrorType = ApiErrorTypeSM.FrameworkException_Log;
    return resp;
  };

  protected ApplyQueryFilterToUrl(currentUrlToHit: string, queryFilter?: QueryFilter | null): string {
    if (!queryFilter) return currentUrlToHit;

    let urlQuery: string = '';
    if (queryFilter.skip !== undefined && queryFilter.top !== undefined && queryFilter.skip >= 0 && queryFilter.top > 0)
      urlQuery += `$skip=${queryFilter.skip}&$top=${queryFilter.top}`;

    if (urlQuery) {
      currentUrlToHit += currentUrlToHit.indexOf('?') > 0 ? `&${urlQuery}` : `?${urlQuery}`;
    }

    return currentUrlToHit;
  }

  private async AddCommonHeaders(
    commonHeaders: IDictionaryCollection<string, string> | null
  ): Promise<IDictionaryCollection<string, string>> {
    if (!commonHeaders) commonHeaders = new DictionaryCollection<string, string>();
    commonHeaders.Add(AppConstants.HeadersName.ApiType, AppConstants.HeadersValue.ApiType);
    commonHeaders.Add(AppConstants.HeadersName.DevApk, AppConstants.HeadersValue.DevApk);
    commonHeaders.Add(AppConstants.HeadersName.AppVersion, AppConstants.HeadersValue.AppVersion);
    return commonHeaders;
  }
}
