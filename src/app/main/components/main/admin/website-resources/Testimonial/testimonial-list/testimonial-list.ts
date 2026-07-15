import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BaseComponent } from '../../../../../../../base.component';
import { TestimonialViewModel } from '../../../../../../../models/view/website-resource/testimonial.viewmodel';
import { LogHandlerService } from '../../../../../../../services/log-handler.service';
import { CommonService } from '../../../../../../../services/common.service';
import { PaginationComponent } from '../../../../../internal/pagination/pagination.component';
import { TestimonialService } from '../../../../../../../services/testimonial.service';
import { TestimonialSM } from '../../../../../../../models/service-models/app/v1/website-resource/testimonial-s-m';
import { AddEditTestimonial } from '../add-edit-testimonial/add-edit-testimonial';


@Component({
  selector: 'app-testimonial-list',
   imports: [CommonModule,FormsModule,PaginationComponent],
  templateUrl: './testimonial-list.html',
  styleUrl: './testimonial-list.scss'
})

export class TestimonialList extends BaseComponent<TestimonialViewModel> implements OnInit {
    protected _logHandler: LogHandlerService;
  constructor(commonService:CommonService,logHandler:LogHandlerService, private modalService: NgbModal,private testimonialService: TestimonialService) {
    super(commonService,logHandler);
    this._logHandler = logHandler;
    this.viewModel = new TestimonialViewModel();
  }
  // Testimonial: Testimonial[] = [];
  // filteredTestimonial: Testimonial[] = [];

  ngOnInit(){
this.loadPageData()
  }

  // Additional methods for handling Testimonial can be added here
   override async loadPageData(){
     try {
      this._commonService.presentLoading();
      let resp=await this.testimonialService.getAllPaginatedTestimonial(this.viewModel);
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
        this.viewModel.TestimonialSMList = resp.successData;
        console.log('Testimonial loaded:', this.viewModel.TestimonialSMList);
          //     this.Testimonial = data;
         this.viewModel.filteredTestimonials = [...resp.successData];
         this.sortData();
         this.TotalTestimonialCount();
      }

     } catch (error) {
      
        await this._logHandler.logObject(error);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Failed to load Testimonial.',
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
      this.viewModel.filteredTestimonials = [...this.viewModel.TestimonialSMList];
    } else {
      const term = this.viewModel.searchTerm.toLowerCase();
      this.viewModel.filteredTestimonials  = this.viewModel.TestimonialSMList.filter(cat => 
        cat.name.toLowerCase().includes(term) || 
        (cat.message && cat.message.toLowerCase().includes(term))
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
    
    this.viewModel.filteredTestimonials.sort((a, b) => {
      let valueA = a[this.viewModel.sortField as keyof TestimonialSM];
      let valueB = b[this.viewModel.sortField as keyof TestimonialSM];
      
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

  async TotalTestimonialCount(){
    try {
      this._commonService.presentLoading();
      let resp = await this.testimonialService.getTotalTestimonialCount();
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
        text: 'Failed to load total Testimonial count.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  
openFormModal(Testimonial?: TestimonialSM): void {
    const modalRef = this.modalService.open(AddEditTestimonial, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.Testimonial = Testimonial || null;    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadPageData();
      }
    }).catch(() => {});
  }

confirmDelete(id: number): void {
   this._commonService.showConfirmationAlert
    if (confirm('Are you sure you want to delete this Testimonial?')) {
      this.testimonialService.deleteTestimonial(id);
         this.loadPageData();
    }
  }
}
