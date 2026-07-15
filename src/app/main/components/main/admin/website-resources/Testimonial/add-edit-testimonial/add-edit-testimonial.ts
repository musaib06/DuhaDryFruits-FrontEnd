import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseComponent } from '../../../../../../../base.component';
import { TestimonialSM } from '../../../../../../../models/service-models/app/v1/website-resource/testimonial-s-m';
import { TestimonialViewModel } from '../../../../../../../models/view/website-resource/testimonial.viewmodel';
import { CommonService } from '../../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../../services/log-handler.service';
import { TestimonialService } from '../../../../../../../services/testimonial.service';


@Component({
  selector: 'app-add-edit-testimonial',
    imports: [CommonModule, FormsModule],
  templateUrl: './add-edit-testimonial.html',
  styleUrl: './add-edit-testimonial.scss'
})

export class AddEditTestimonial extends BaseComponent<TestimonialViewModel> implements OnInit {
  @Input() Testimonial: TestimonialSM | null = null;
  isSubmitting = false;
  selectedFile: File | null = null;

  constructor(
    commonService: CommonService,
    private logHandler: LogHandlerService,
    private testimonialService: TestimonialService,
    public activeModal: NgbActiveModal,
  ) {
    super(commonService, logHandler);
    this.viewModel = new TestimonialViewModel();
  }

  ngOnInit() {
    if (this.Testimonial) {
      this.getTestimonialById(this.Testimonial.id);
    }
  }


  async onSubmit(form: any): Promise<void> {
    this.viewModel.FormSubmitted = true;
    if (form.invalid) return;
    this.isSubmitting = true;
    try {
      if (this.Testimonial && this.Testimonial.id) {
        await this.updateTestimonial();
      } else {
        await this.addTestimonial();
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  private async addTestimonial() {
    try {
      this._commonService.presentLoading();
      const formData = new FormData();
      // formData.append("reqData", JSON.stringify(this.viewModel.TestimonialFormData));
      const resp = await this.testimonialService.addTestimonial(this.viewModel.TestimonialFormData);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this._commonService.showSweetAlertToast({
          title: 'Success',
          text: 'Testimonial added successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to add Testimonial.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async updateTestimonial() {
    try {
      this._commonService.presentLoading();
      const resp = await this.testimonialService.updateTestimonial(this.viewModel.TestimonialFormData);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this._commonService.showSweetAlertToast({
          title: 'Success',
          text: 'Testimonial updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to update Testimonial.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async getTestimonialById(id: number) {
    try {
      this._commonService.presentLoading();
      const resp = await this.testimonialService.getTestimonialById(id);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.TestimonialFormData = resp.successData;
        console.log('Testimonial details loaded:', this.viewModel.TestimonialFormData);
        
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load Testimonial details.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }
}

