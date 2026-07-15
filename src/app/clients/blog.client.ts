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
import { BlogSM } from '../models/service-models/app/v1/blog/blog-s-m';
import { BlogCategorySM } from '../models/service-models/app/v1/blog/blog-category-s-m';
import { BlogTagSM } from '../models/service-models/app/v1/blog/blog-tag-s-m';

/**
 * Blog API Client
 * Handles all blog-related API calls
 */
@Injectable({
  providedIn: 'root',
})
export class BlogClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  // ==================== PUBLIC ENDPOINTS ====================

  /** Get all published blogs (paginated) */
  GetPublicBlogs = async (
    page: number = 1,
    limit: number = 9,
    category?: number,
    tag?: number,
    search?: string
  ): Promise<ApiResponse<{ blogs: BlogSM[]; pagination: any }>> => {
    const details = new AdditionalRequestDetails<any>(false, Authentication.false);
    let url = `${AppConstants.ApiUrls.BASE}/blog/public/list?page=${page}&limit=${limit}`;
    if (category) url += `&category=${category}`;
    if (tag) url += `&tag=${tag}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    return await this.GetResponseAsync<null, any>(url, 'GET', null, details);
  };

  /** Get single blog by slug (public) */
  GetPublicBlogBySlug = async (slug: string): Promise<ApiResponse<{ blog: BlogSM; relatedBlogs: BlogSM[] }>> => {
    const details = new AdditionalRequestDetails<any>(false, Authentication.false);
    return await this.GetResponseAsync<null, any>(
      `${AppConstants.ApiUrls.BASE}/blog/public/slug/${slug}`,
      'GET',
      null,
      details
    );
  };

  /** Get featured blogs */
  GetFeaturedBlogs = async (limit: number = 5): Promise<ApiResponse<BlogSM[]>> => {
    const details = new AdditionalRequestDetails<BlogSM[]>(false, Authentication.false);
    return await this.GetResponseAsync<null, BlogSM[]>(
      `${AppConstants.ApiUrls.BASE}/blog/public/featured?limit=${limit}`,
      'GET',
      null,
      details
    );
  };

  /** Get all public categories */
  GetPublicCategories = async (): Promise<ApiResponse<BlogCategorySM[]>> => {
    const details = new AdditionalRequestDetails<BlogCategorySM[]>(false, Authentication.false);
    return await this.GetResponseAsync<null, BlogCategorySM[]>(
      `${AppConstants.ApiUrls.BASE}/blog/public/categories`,
      'GET',
      null,
      details
    );
  };

  /** Get all public tags */
  GetPublicTags = async (): Promise<ApiResponse<BlogTagSM[]>> => {
    const details = new AdditionalRequestDetails<BlogTagSM[]>(false, Authentication.false);
    return await this.GetResponseAsync<null, BlogTagSM[]>(
      `${AppConstants.ApiUrls.BASE}/blog/public/tags`,
      'GET',
      null,
      details
    );
  };

  // ==================== ADMIN ENDPOINTS ====================

  /** Get all blogs (admin) */
  GetAdminBlogs = async (
    page: number = 1,
    limit: number = 20,
    status?: string,
    category?: number,
    search?: string
  ): Promise<ApiResponse<{ blogs: BlogSM[]; pagination: any }>> => {
    // Do not cache admin list — stale empty responses hid real blogs after first load.
    const details = new AdditionalRequestDetails<any>(false);
    let url = `${AppConstants.ApiUrls.BASE}/blog/admin/list?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (category) url += `&category=${category}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    return await this.GetResponseAsync<null, any>(url, 'GET', null, details);
  };

  /** Get single blog by ID (admin) */
  GetAdminBlogById = async (id: number): Promise<ApiResponse<BlogSM>> => {
    const details = new AdditionalRequestDetails<BlogSM>(false);
    return await this.GetResponseAsync<null, BlogSM>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/${id}`,
      'GET',
      null,
      details
    );
  };

  /** Create new blog */
  CreateBlog = async (formData: FormData): Promise<ApiResponse<BlogSM>> => {
    const details = new AdditionalRequestDetails<BlogSM>(true);
    return await this.GetResponseAsync<FormData, BlogSM>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/create`,
      'POST',
      formData,
      details
    );
  };

  /** Update blog */
  UpdateBlog = async (id: number, formData: FormData): Promise<ApiResponse<BlogSM>> => {
    const details = new AdditionalRequestDetails<BlogSM>(true);
    return await this.GetResponseAsync<FormData, BlogSM>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/update/${id}`,
      'PUT',
      formData,
      details
    );
  };

  /** Delete blog (soft delete) */
  DeleteBlog = async (id: number): Promise<ApiResponse<any>> => {
    const details = new AdditionalRequestDetails<any>(true);
    return await this.GetResponseAsync<null, any>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/delete/${id}`,
      'DELETE',
      null,
      details
    );
  };

  // ==================== CATEGORY ADMIN ENDPOINTS ====================

  /** Get all categories (admin) */
  GetAdminCategories = async (): Promise<ApiResponse<BlogCategorySM[]>> => {
    const details = new AdditionalRequestDetails<BlogCategorySM[]>(true);
    return await this.GetResponseAsync<null, BlogCategorySM[]>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/categories`,
      'GET',
      null,
      details
    );
  };

  /** Create category */
  CreateCategory = async (reqData: { name: string; color?: string; slug?: string }): Promise<ApiResponse<BlogCategorySM>> => {
    const details = new AdditionalRequestDetails<BlogCategorySM>(true);
    return await this.GetResponseAsync<{ name: string; color?: string; slug?: string }, BlogCategorySM>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/category/create`,
      'POST',
      reqData,
      details
    );
  };

  /** Update category */
  UpdateCategory = async (id: number, reqData: { name: string; color?: string; slug?: string }): Promise<ApiResponse<BlogCategorySM>> => {
    const details = new AdditionalRequestDetails<BlogCategorySM>(true);
    return await this.GetResponseAsync<{ name: string; color?: string; slug?: string }, BlogCategorySM>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/category/update/${id}`,
      'PUT',
      reqData,
      details
    );
  };

  /** Delete category */
  DeleteCategory = async (id: number): Promise<ApiResponse<any>> => {
    const details = new AdditionalRequestDetails<any>(true);
    return await this.GetResponseAsync<null, any>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/category/delete/${id}`,
      'DELETE',
      null,
      details
    );
  };

  // ==================== TAG ADMIN ENDPOINTS ====================

  /** Get all tags (admin) */
  GetAdminTags = async (): Promise<ApiResponse<BlogTagSM[]>> => {
    const details = new AdditionalRequestDetails<BlogTagSM[]>(true);
    return await this.GetResponseAsync<null, BlogTagSM[]>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/tags`,
      'GET',
      null,
      details
    );
  };

  /** Create tag */
  CreateTag = async (reqData: { name: string; color?: string; slug?: string }): Promise<ApiResponse<BlogTagSM>> => {
    const details = new AdditionalRequestDetails<BlogTagSM>(true);
    return await this.GetResponseAsync<any, BlogTagSM>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/tag/create`,
      'POST',
      { reqData: JSON.stringify(reqData) },
      details
    );
  };

  /** Update tag */
  UpdateTag = async (id: number, reqData: { name?: string; color?: string }): Promise<ApiResponse<BlogTagSM>> => {
    const details = new AdditionalRequestDetails<BlogTagSM>(true);
    return await this.GetResponseAsync<any, BlogTagSM>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/tag/update/${id}`,
      'PUT',
      { reqData: JSON.stringify(reqData) },
      details
    );
  };

  /** Delete tag */
  DeleteTag = async (id: number): Promise<ApiResponse<any>> => {
    const details = new AdditionalRequestDetails<any>(true);
    return await this.GetResponseAsync<null, any>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/tag/delete/${id}`,
      'DELETE',
      null,
      details
    );
  };

  // ==================== MEDIA ADMIN ENDPOINTS ====================

  /** Delete media */
  DeleteMedia = async (id: number): Promise<ApiResponse<any>> => {
    const details = new AdditionalRequestDetails<any>(true);
    return await this.GetResponseAsync<null, any>(
      `${AppConstants.ApiUrls.BASE}/blog/admin/media/delete/${id}`,
      'DELETE',
      null,
      details
    );
  };
}
