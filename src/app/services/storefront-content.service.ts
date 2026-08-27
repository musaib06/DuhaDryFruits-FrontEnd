import { Injectable } from '@angular/core';
import { BlogService } from './blog.service';
import { VideoService } from './video.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { UserProductViewModel } from '../models/view/end-user/product/user-product.viewmodel';
import { CategorySM } from '../models/service-models/app/v1/categories-s-m';
import { VideoSM } from '../models/service-models/app/v1/website-resource/video-s-m';

export interface GiftHamperNav {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class StorefrontContentService {
  blogCount = 0;
  videoCount = 0;
  videos: VideoSM[] = [];
  giftHamper: GiftHamperNav | null = null;
  private loadPromise: Promise<void> | null = null;

  constructor(
    private blogService: BlogService,
    private videoService: VideoService,
    private categoryService: CategoryService,
    private productService: ProductService,
  ) {}

  get showJournal(): boolean {
    return this.blogCount > 0;
  }

  get showMedia(): boolean {
    return this.videoCount > 0;
  }

  get showGiftHampers(): boolean {
    return !!this.giftHamper;
  }

  static isGiftHamperCategory(category: { name?: string } | null | undefined): boolean {
    const name = String(category?.name || '').toLowerCase();
    return /gift\s*hamper|hamper|gift\s*box|gift\s*pack/.test(name);
  }

  async ensureLoaded(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.refresh();
    return this.loadPromise;
  }

  private async refresh(): Promise<void> {
    await Promise.all([this.loadBlogs(), this.loadVideos(), this.loadGiftHampers()]);
  }

  private async loadBlogs(): Promise<void> {
    try {
      this.blogCount = (await this.blogService.getPublicBlogCount()) || 0;
    } catch {
      this.blogCount = 0;
    }
  }

  private async loadVideos(): Promise<void> {
    try {
      const resp = await this.videoService.getStorefrontVideos(1, 100);
      this.videos = !resp.isError ? resp.successData || [] : [];
      this.videoCount = this.videos.length;
    } catch {
      this.videos = [];
      this.videoCount = 0;
    }
  }

  private async loadGiftHampers(): Promise<void> {
    this.giftHamper = null;
    try {
      const cats = await this.categoryService.getStorefrontCategories(200);
      if (cats.isError) return;
      const hamper = (cats.successData || []).find((c: CategorySM) =>
        StorefrontContentService.isGiftHamperCategory(c),
      );
      if (!hamper?.id) return;

      const vm = new UserProductViewModel();
      vm.pagination.PageNo = 1;
      vm.pagination.PageSize = 4;
      vm.categoryId = hamper.id;
      const products = await this.productService.getAllProductsByCategoryId(vm);
      const list = !products.isError ? products.successData || [] : [];
      if (list.length > 0) {
        this.giftHamper = { id: hamper.id, name: hamper.name };
      }
    } catch {
      this.giftHamper = null;
    }
  }
}
