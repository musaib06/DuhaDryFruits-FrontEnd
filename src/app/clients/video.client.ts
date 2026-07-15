import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import {
  AdditionalRequestDetails,
  Authentication,
} from '../models/internal/additional-request-details';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { VideoSM } from '../models/service-models/app/v1/website-resource/video-s-m';
@Injectable({
  providedIn: 'root',
})
export class VideoClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }
   GetAllPaginatedVideo = async (
     queryFilter: QueryFilter
   ): Promise<ApiResponse<VideoSM[]>> => {
     let resp = await this.GetResponseAsync<null, VideoSM[]>(
       `${AppConstants.ApiUrls.VIDEO}/getall/paginated?skip=${queryFilter.skip}&top=${queryFilter.top}`,
       'GET',null, new AdditionalRequestDetails<VideoSM[]>(false, Authentication.false  )
     );
     
     return resp;
   };
 
   GetTotatVideoCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
     let resp = await this.GetResponseAsync<null, IntResponseRoot>(
       `${AppConstants.ApiUrls.VIDEO}/count`,
       'GET'
     );
     return resp;
   };
 
    /** Add a new category */
     AddVideo  = async (VideoFormData: ApiRequest<VideoSM>): Promise<ApiResponse<VideoSM>> => {
         let resp = await this.GetResponseAsync<VideoSM, VideoSM>(
           `${AppConstants.ApiUrls.VIDEO}/create`,
           'POST',
           VideoFormData);
         return resp;
       };
 
     UpdateVideo = async (
   apiRequest: ApiRequest<VideoSM>
 ): Promise<ApiResponse<VideoSM>> => {
   return await this.GetResponseAsync<VideoSM, VideoSM>(
     `${AppConstants.ApiUrls.VIDEO}/update/${apiRequest.reqData.id}`,
     'PUT',
     apiRequest
   );
 };
 
 
         /**
    * Update existing Video
    * 
    * @param updateVideo Video data to update
    * @returns Promise<ApiResponse<VideoSM>>
    * @example
    * const updatedVideo = new VideoSM();
   
    */
   /**delete Video by id */
   DeleteVideoById = async (
     Id: number
   ): Promise<ApiResponse<DeleteResponseRoot>> => {
     let resp = await this.GetResponseAsync<number, DeleteResponseRoot>(
       `${AppConstants.ApiUrls.VIDEO}/delete/${Id}`,
       'DELETE'
     );
     return resp;
   };
 
   GetVideoById = async (Id: number): Promise<ApiResponse<VideoSM>> => {
     let resp = await this.GetResponseAsync<number, VideoSM>(
       `${AppConstants.ApiUrls.VIDEO}/getbyid/${Id}`,
       'GET'
     );
     return resp;
   };
}
