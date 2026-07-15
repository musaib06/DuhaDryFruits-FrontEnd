import { FormGroup } from '@angular/forms';
import { BaseViewModel } from '../../internal/base.viewmodel';
import { ReviewSM } from '../../service-models/app/v1/review-s-m';



export class ReviewViewModel extends BaseViewModel {
 ReviewFormData: ReviewSM = new ReviewSM();
  ReviewForm!: FormGroup;
  ReviewId: number = 0;
  ReviewSMList :ReviewSM [] = [];
  showAddModal = false;
  showEditModal = false;
  fileName: string = '';
  updateMode: boolean = false;
    filteredReviews: ReviewSM[] = [];
    searchTerm = '';
    sortField = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';
}
