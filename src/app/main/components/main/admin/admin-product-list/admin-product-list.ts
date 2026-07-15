import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../base.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from '../../../../../services/product.service';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../internal/pagination/pagination.component';
import { AdminProductForm } from './admin-product-form/admin-product-form';
import { AdminProductFaq } from './admin-product-faq/admin-product-faq';
import { ProductSM } from '../../../../../models/service-models/app/v1/product-s-m';
import { AdminProductsViewModel } from '../../../../../models/view/Admin/admin-product.viewmodel';
import { ProductVariantSM } from '../../../../../models/service-models/app/v1/variants-s-m';
import { resolveProductImage } from '../../../../../utils/image-url.util';

@Component({
  selector: 'app-admin-product-list',
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './admin-product-list.html',
  styleUrl: './admin-product-list.scss'
})
export class AdminProductList extends BaseComponent<AdminProductsViewModel> implements OnInit {
  protected _logHandler: LogHandlerService;
  private searchDebounceTimer: any = null;
  bestSellingFilter: 'all' | 'top' | 'not-top' = 'all';
  isSearching: boolean = false;
  searchMessage: string = '';

  constructor(
    commonService: CommonService,
    logHandler: LogHandlerService,
    private modalService: NgbModal,
    private productService: ProductService
  ) {
    super(commonService, logHandler);
    this._logHandler = logHandler;
    this.viewModel = new AdminProductsViewModel();
  }

  ngOnInit() {
    this.loadPageData();
  }

  override async loadPageData() {
    try {
      this._commonService.presentLoading();
      const q = (this.viewModel.searchTerm || '').trim();

      // When bestSellingFilter is active (top / not-top), fetch ALL products
      // so filtering works across entire catalogue, not just current page
      const isBestSellingFilterActive = this.bestSellingFilter !== 'all';

      const queryFilter = isBestSellingFilterActive
        ? { skip: 0, top: 10000 }  // Large number to get all products
        : {
            skip: (this.viewModel.pagination.PageNo - 1) * this.viewModel.pagination.PageSize,
            top: this.viewModel.pagination.PageSize
          };

      let resp;
      if (q.length > 0) {
        resp = await this.productService.getAdminProductsBySearchString(q, queryFilter);
      } else if (isBestSellingFilterActive) {
        // Use large page size to fetch all products
        const allProductsVM: any = {
          pagination: { PageNo: 1, PageSize: 10000, totalCount: 0, totalPages: [] }
        };
        resp = await this.productService.getAdminCatalogProducts(allProductsVM);
      } else {
        resp = await this.productService.getAdminCatalogProducts(this.viewModel);
      }

      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        this.viewModel.products = resp.successData;
        this.applyBestSellingFilter();

        if (isBestSellingFilterActive) {
          // Update pagination based on filtered results
          this.viewModel.pagination.totalCount = this.viewModel.filteredProducts.length;
          this.viewModel.pagination.totalPages = this.getPagesCountArray(this.viewModel.pagination);
        } else if (q.length > 0) {
          await this.updateSearchTotalCount(q);
        } else {
          await this.TotalProductCount();
        }
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load products.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }
 async setIsBestSellingState(id:number,state:boolean) {
    try {
      this._commonService.presentLoading();
      this.viewModel.boolResponseRoot.boolResponse=state;
      const resp = await this.productService.setIsBestSellingProductState(id,this.viewModel.boolResponseRoot);
      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        this.viewModel.boolResponseRoot = resp.successData;
        this.loadPageData()
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load products.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

   private async updateProduct() {
    try {
      this._commonService.presentLoading();
      const formData = new FormData();
      formData.append('reqData', JSON.stringify(this.viewModel.productFormData));
      const resp = await this.productService.updateProduct(formData, this.viewModel.productFormData.id);
      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error'
        });
      } else {
        this._commonService.showSweetAlertToast({
          title: 'Success',
          text: 'Product state updated successfully.',
          icon: 'success'
        });
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to update product.',
        icon: 'error'
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }
  /**
   * Get total stock across all variants for a product
   * REFACTOR: Helper method to calculate total variant stock
   */
  getTotalStock(product: ProductSM): number {
    if (!product.variants || product.variants.length === 0) {
      return 0;
    }
    return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  /**
   * Get category name from product
   * REFACTOR: Helper method to safely access category
   */
  getCategoryName(product: ProductSM): string {
    return (product as any).category?.name || '-';
  }

  async TotalProductCount() {
    try {
      this._commonService.presentLoading();
      const resp = await this.productService.getAdminTotalProductCount();
      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.pagination.totalCount = resp.successData.intResponse;
        this.viewModel.pagination.totalPages = this.getPagesCountArray(this.viewModel.pagination);
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load product count.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }
  async loadPagedataWithPagination(pageNumber: number) {
    if (pageNumber && pageNumber > 0) {
      this.viewModel.pagination.PageNo = pageNumber;
      await this.loadPageData();
    }
  }

  applyFilter(): void {
    const searchTerm = (this.viewModel.searchTerm || '').trim();

    // Clear any existing timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // If search term is between 1-2 characters, show message but don't search yet
    if (searchTerm.length > 0 && searchTerm.length < 3) {
      this.searchMessage = 'Type at least 3 characters to search...';
      this.isSearching = false;
      return;
    }

    // Clear message when valid search term
    this.searchMessage = '';

    // If search is cleared, reload all products immediately
    if (searchTerm.length === 0) {
      this.isSearching = false;
      this.viewModel.pagination.PageNo = 1;
      this.loadPageData();
      return;
    }

    // Show loading and debounce the search (500ms)
    this.isSearching = true;
    this.searchDebounceTimer = setTimeout(async () => {
      this.viewModel.pagination.PageNo = 1;
      await this.loadPageData();
      this.isSearching = false;
    }, 500);
  }

  async onBestSellingFilterChange(): Promise<void> {
    // Reset to page 1 and reload data (fetches all products if filter is active)
    this.viewModel.pagination.PageNo = 1;
    await this.loadPageData();
  }

  applyBestSellingFilter(): void {
    const base = [...(this.viewModel.products || [])];
    if (this.bestSellingFilter === 'top') {
      this.viewModel.filteredProducts = base.filter((p) => !!p.isBestSelling);
    } else if (this.bestSellingFilter === 'not-top') {
      this.viewModel.filteredProducts = base.filter((p) => !p.isBestSelling);
    } else {
      this.viewModel.filteredProducts = base;
    }
    this.sortData();
  }

  sortData(field?: string): void {
    if (field) {
      if (this.viewModel.sortField === field) {
        this.viewModel.sortDirection = this.viewModel.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.viewModel.sortField = field;
        this.viewModel.sortDirection = 'asc';
      }
    }

    this.viewModel.filteredProducts.sort((a, b) => {
      let valueA: any = a[this.viewModel.sortField as keyof ProductSM];
      let valueB: any = b[this.viewModel.sortField as keyof ProductSM];

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return this.viewModel.sortDirection === 'asc' ? 1 : -1;
      if (valueB === undefined) return this.viewModel.sortDirection === 'asc' ? -1 : 1;
      if (valueA < valueB) return this.viewModel.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.viewModel.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(field: string): string {
    if (this.viewModel.sortField !== field) return 'bi-sort';
    return this.viewModel.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

 

  openFormModal(product?: ProductSM): void {
    const modalRef = this.modalService.open(AdminProductForm, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.product = product || null;
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.viewModel.pagination.PageNo = 1;
        this.loadPageData();
      }
    }).catch(() => {});
  }

  openFaqModal(product: ProductSM): void {
    const modalRef = this.modalService.open(AdminProductFaq, {
      centered: true,
      size: 'lg',
      scrollable: true,
    });
    modalRef.componentInstance.product = product;
    modalRef.result.catch(() => {});
  }

  async confirmDelete(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        this._commonService.presentLoading();
        const resp = await this.productService.deleteProduct(id);
        if (resp.isError) {
          await this._logHandler.logObject(resp.errorData);
          this._commonService.showSweetAlertToast({
            title: 'Error',
            text: resp.errorData.displayMessage,
            icon: 'error'
          });
        } else {
          const successData = resp.successData as any;
          const msg =
            successData?.message ||
            (successData?.archived
              ? 'Product was archived (hidden from store) because it has order history.'
              : successData?.deactivated
                ? 'Item was deactivated because it has order history.'
                : 'Product deleted successfully.');
          this._commonService.showSweetAlertToast({
            title: 'Success',
            text: msg,
            icon: 'success'
          });
          this.viewModel.pagination.PageNo = 1;
          await this.loadPageData();
        }
      } catch (error) {
        await this._logHandler.logObject(error);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Failed to delete product.',
          icon: 'error'
        });
      } finally {
        this._commonService.dismissLoader();
      }
    }
  }

  getProductImageSrc(product: ProductSM, fallback = ''): string {
    return resolveProductImage(product, fallback || 'assets/logo.png');
  }

  private async updateSearchTotalCount(searchTerm: string) {
    const allResultsResp = await this.productService.getAdminProductsBySearchString(searchTerm, { skip: 0, top: 10000 });
    if (allResultsResp.isError) {
      // Fallback to current page length when count probe fails.
      this.viewModel.pagination.totalCount = this.viewModel.filteredProducts.length;
    } else {
      this.viewModel.pagination.totalCount = allResultsResp.successData?.length || 0;
    }
    this.viewModel.pagination.totalPages = this.getPagesCountArray(this.viewModel.pagination);
  }
}
