import { FormGroup } from '@angular/forms';
import { BaseViewModel } from '../../internal/base.viewmodel';
import { TestimonialSM } from '../../service-models/app/v1/website-resource/testimonial-s-m';



export class TestimonialViewModel extends BaseViewModel {
  TestimonialFormData: TestimonialSM = new TestimonialSM();
  TestimonialForm!: FormGroup;
  TestimonialId: number = 0;
  TestimonialSMList :TestimonialSM [] = [];
  showAddModal = false;
  showEditModal = false;
  fileName: string = '';
  updateMode: boolean = false;
    filteredTestimonials: TestimonialSM[] = [];
    searchTerm = '';
    sortField = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';
}