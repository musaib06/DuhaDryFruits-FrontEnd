import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';   // ✅ Use template-driven forms
import { BaseComponent } from '../../../../../../base.component';
import { BannerViewModel } from '../../../../../../models/view/website-resource/banner.viewmodel';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { BannerService } from '../../../../../../services/banner.service';
import { PaginationComponent } from '../../../../internal/pagination/pagination.component';
import { BannerSM } from '../../../../../../models/service-models/app/v1/website-resource/banner-s-m';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminWebsiteResources } from './AddEditForm/admin-website-resources';
import { resolveBannerImage } from '../../../../../../utils/image-url.util';

@Component({
  selector: 'app-website-resources',
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './website-resources.component.html',
  styleUrls: ['./website-resources.component.scss'],
  standalone: true,
})
export class WebsiteResourcesComponent extends BaseComponent<BannerViewModel> implements OnInit {
  protected _logHandler: LogHandlerService;
  constructor(commonService:CommonService,logHandler:LogHandlerService, private modalService: NgbModal,private bannerService: BannerService) {
    super(commonService,logHandler);
    this._logHandler = logHandler;
    this.viewModel = new BannerViewModel();
    this.viewModel.sortField = 'sequence';
  }
  ngOnInit(){
   this.loadPageData()
  }

  // Additional methods for handling categories can be added here
   override async loadPageData(){
     try {
      this._commonService.presentLoading();
      let resp=await this.bannerService.getAllBanners(this.viewModel);
      if(resp.isError){
       await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
      else{
        this.viewModel.bannerSMList = (resp.successData || []).map((banner) => ({
          ...banner,
          sequence: this.getBannerSequence(banner),
        }));
        //     this.categories = data;
        this.viewModel.filteredBanners = [...this.viewModel.bannerSMList];
        // console.log('Categories loaded:', this.viewModel.filteredBanners);
         this.sortData();
         this.TotalCategoryCount();
      }

     } catch (error) {
      
        await this._logHandler.logObject(error);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Failed to load categories.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    
     finally{
      this._commonService.dismissLoader();
     }
  }

    /**this function is used to create an event for pagination */
  async loadPagedataWithPagination(pageNumber: number) {
    if (pageNumber && pageNumber > 0) {
      // this.viewModel.PageNo = pageNumber;
      this.viewModel.pagination.PageNo = pageNumber;
      await this.loadPageData();
    }
  }
 applyFilter(): void {
    if (!this.viewModel.searchTerm) {
      this.viewModel.filteredBanners = [...this.viewModel.bannerSMList];
    } else {
      const term = this.viewModel.searchTerm.toLowerCase();
      this.viewModel.filteredBanners  = this.viewModel.bannerSMList.filter(cat => 
        (cat.title && cat.title.toLowerCase().includes(term)) || 
        (cat.description && cat.description.toLowerCase().includes(term))
      );
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
    
    this.viewModel.filteredBanners.sort((a, b) => {
      let valueA =
        this.viewModel.sortField === 'sequence'
          ? this.getBannerSequence(a)
          : a[this.viewModel.sortField as keyof BannerSM];
      let valueB =
        this.viewModel.sortField === 'sequence'
          ? this.getBannerSequence(b)
          : b[this.viewModel.sortField as keyof BannerSM];
      
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

  getBannerSequence(item: any): number {
    const raw =
      item?.sequence ??
      item?.Sequence ??
      item?.displayOrder ??
      item?.DisplayOrder ??
      item?.order ??
      item?.Order ??
      0;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  getSortIcon(field: string): string {
    if (this.viewModel.sortField !== field) return 'bi-sort';
    return this.viewModel.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  async TotalCategoryCount(){
    try {
      this._commonService.presentLoading();
      let resp = await this.bannerService.getTotalBannersCount();
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
        console.log(this.viewModel.pagination.totalCount)
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load total category count.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  
openFormModal(banner?: BannerSM): void {
    const modalRef = this.modalService.open(AdminWebsiteResources, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.banner = banner || null;    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadPageData();
      }
    }).catch(() => {});
  }

confirmDelete(id: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.bannerService.deleteBanner(id);
         this.loadPageData();
    }
  }

  bannerImage(item: BannerSM): string {
    return resolveBannerImage(item);
  }
}