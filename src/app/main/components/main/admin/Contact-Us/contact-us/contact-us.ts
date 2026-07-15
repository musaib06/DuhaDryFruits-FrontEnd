

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../../internal/pagination/pagination.component';
import { ContactUsViewModel } from '../../../../../../models/view/Admin/contact-us.viewmodel';
import { BaseComponent } from '../../../../../../base.component';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { CommonService } from '../../../../../../services/common.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ContactUsService } from '../../../../../../services/contact-us.service';
import { ContactUsSM } from '../../../../../../models/service-models/app/v1/contact-us-s-m';
import { AddEditContactUs } from '../add-edit-contact-us/add-edit-contact-us';

@Component({
  selector: 'app-contact-us',
  imports: [CommonModule,FormsModule,PaginationComponent],

  templateUrl: './contact-us.html',
  styleUrl: './contact-us.scss'
})
export class ContactUs extends BaseComponent<ContactUsViewModel> implements OnInit {
    protected _logHandler: LogHandlerService;
  constructor(commonService:CommonService,logHandler:LogHandlerService, private modalService: NgbModal,private contactUsService: ContactUsService) {
    super(commonService,logHandler);
    this._logHandler = logHandler;
    this.viewModel = new ContactUsViewModel();
  }
  // categories: ContactUs[] = [];
  // filteredCategories: ContactUs[] = [];

  ngOnInit(){
this.loadPageData()
  }

  // Additional methods for handling categories can be added here
   override async loadPageData(){
     this.viewModel.isLoading = true;
     try {
      this._commonService.presentLoading();
      let resp=await this.contactUsService.getAllPaginatedContactUs(this.viewModel);
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
        this.viewModel.ContactUsList = resp.successData;
        console.log('Categories loaded:', this.viewModel.ContactUsList);
          //     this.categories = data;
         this.viewModel.filteredContactUs = [...resp.successData];
         this.sortData();
         this.TotalContactUsCount();
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
      this.viewModel.isLoading = false;
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
      this.viewModel.filteredContactUs = [...this.viewModel.ContactUsList];
    } else {
      const term = this.viewModel.searchTerm.toLowerCase();
      this.viewModel.filteredContactUs  = this.viewModel.ContactUsList.filter(cat => 
        cat.name.toLowerCase().includes(term) || 
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
    
    this.viewModel.filteredContactUs.sort((a, b) => {
      let valueA = a[this.viewModel.sortField as keyof ContactUsSM];
      let valueB = b[this.viewModel.sortField as keyof ContactUsSM];
      
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

  async TotalContactUsCount(){
    try {
      this._commonService.presentLoading();
      let resp = await this.contactUsService.getTotalContactUsCount();
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
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load total ContactUs count.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  
openFormModal(ContactUs?: ContactUsSM): void {
    const modalRef = this.modalService.open(AddEditContactUs, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.contactUs = ContactUs || null;    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadPageData();
      }
    }).catch(() => {});
  }

confirmDelete(id: number): void {
    if (confirm('Are you sure you want to delete this ContactUs?')) {
      this.contactUsService.deleteContactUs(id);
         this.loadPageData();
    }
  }
}
