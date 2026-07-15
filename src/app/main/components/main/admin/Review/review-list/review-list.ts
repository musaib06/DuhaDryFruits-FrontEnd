import { Component, OnInit } from '@angular/core';
import { ReviewViewModel } from '../../../../../../models/view/Admin/review.viewmodel';
import { BaseComponent } from '../../../../../../base.component';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { ReviewService } from '../../../../../../services/review.service';
import { ReviewSM } from '../../../../../../models/service-models/app/v1/review-s-m';
import { AddEditReview } from '../add-edit-review/add-edit-review';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../../internal/pagination/pagination.component';

@Component({
  selector: 'app-review-list',
  imports: [CommonModule,FormsModule,PaginationComponent],
  templateUrl: './review-list.html',
  styleUrl: './review-list.scss'
})
export class ReviewList extends BaseComponent<ReviewViewModel>
  implements OnInit
{

  constructor(
    commonService: CommonService,
    private logHandlerService: LogHandlerService,
    private reviewService: ReviewService,
    private modalService: NgbModal
  ) {
    super(commonService, logHandlerService);
    this.viewModel = new ReviewViewModel();
  }

   ngOnInit(){
  this.loadPageData()
    }
  
    // Additional methods for handling categories can be added here
     override async loadPageData(){
       try {
        this._commonService.presentLoading();
        let resp=await this.reviewService.getAllPaginatedReview(this.viewModel);
        if(resp.isError){
         await this.logHandlerService.logObject(resp.errorData);
          this._commonService.showSweetAlertToast({
            title: 'Error',
            text: resp.errorData.displayMessage,
            icon: 'error',
            confirmButtonText: 'OK',
          });
        }
        else{
          this.viewModel.ReviewSMList = resp.successData;
          console.log('Categories loaded:', this.viewModel.ReviewSMList);
            //     this.categories = data;
           this.viewModel.filteredReviews = [...resp.successData];
           this.sortData();
           this.TotalReviewUsCount();
        }
  
       } catch (error) {
        
          await this.logHandlerService.logObject(error);
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
        this.viewModel.filteredReviews = [...this.viewModel.ReviewSMList];
      } else {
        const term = this.viewModel.searchTerm.toLowerCase();
        this.viewModel.filteredReviews  = this.viewModel.ReviewSMList.filter(cat => 
          cat.name.toLowerCase().includes(term) || 
          (cat.email && cat.email.toLowerCase().includes(term))
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
      
      this.viewModel.filteredReviews.sort((a, b) => {
        let valueA = a[this.viewModel.sortField as keyof ReviewSM];
        let valueB = b[this.viewModel.sortField as keyof ReviewSM];
        
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
  
    async TotalReviewUsCount(){
      try {
        this._commonService.presentLoading();
        let resp = await this.reviewService.getTotalReviewCount();
        if (resp.isError) {
          await this.logHandlerService.logObject(resp.errorData);
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
        await this.logHandlerService.logObject(error);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Failed to load total ReviewUs count.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } finally {
        this._commonService.dismissLoader();
      }
    }
  
    
  openFormModal(ReviewUs?: ReviewSM): void {
      const modalRef = this.modalService.open(AddEditReview, {
        centered: true,
        size: 'lg'
      });
      modalRef.componentInstance.ReviewUs = ReviewUs || null;    
      modalRef.result.then((result) => {
        if (result === 'saved') {
          this.loadPageData();
        }
      }).catch(() => {});
    }
  
  confirmDelete(id: number): void {
      if (confirm('Are you sure you want to delete this ReviewUs?')) {
        this.reviewService.deleteReview(id);
           this.loadPageData();
      }
    }

// toggleApproval(item: any,productId:number) {
//   const updatedValue = !item.isApproved;
//   this.viewModel.reviewStatus.isApproved=!item.isApproved;

//   this.reviewService.approveOrRejectReview(item.id, reqBody).subscribe({
//     next: (res: any) => {
//       item.isApproved = updatedValue; // update UI instantly
//       this.toastService.success(`Review ${updatedValue ? 'approved' : 'rejected'} successfully`);
//     },
//     error: (err: any) => {
//       this.toastService.error(err.error?.message || 'Action failed');
//     }
//   });
// }
async toggleApproval(item: ReviewSM) {
  const originalState = item.isApproved;
  item.isApproved = !item.isApproved; // Optimistic UI update

  try {
    this._commonService.presentLoading();

    const body = { isApproved: item.isApproved };
    const resp = await this.reviewService.updateReviewStatus(body, item.id);

    if (resp.isError) {
      item.isApproved = originalState; // Rollback UI
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: resp.errorData.displayMessage,
        icon: 'error'
      });
      return;
    }

    this._commonService.showSweetAlertToast({
      title: 'Success',
      text: `Review ${item.isApproved ? 'Approved' : 'Marked Pending'}`,
      icon: 'success'
    });

  } catch (err) {
    item.isApproved = originalState; // Rollback UI
    this._commonService.showSweetAlertToast({
      title: 'Error',
      text: 'Failed to update review status.',
      icon: 'error'
    });

  } finally {
    this._commonService.dismissLoader();
  }
}

  }
