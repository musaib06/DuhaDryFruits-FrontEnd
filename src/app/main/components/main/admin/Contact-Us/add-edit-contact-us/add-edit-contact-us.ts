
import { Component, Input, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../../base.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactUsService } from '../../../../../../services/contact-us.service';
import { ContactUsViewModel } from '../../../../../../models/view/Admin/contact-us.viewmodel';
import { ContactUsSM } from '../../../../../../models/service-models/app/v1/contact-us-s-m';

@Component({
  selector: 'app-add-edit-contact-us',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-edit-contact-us.html',
  styleUrl: './add-edit-contact-us.scss'
})
export class AddEditContactUs extends BaseComponent<ContactUsViewModel> implements OnInit {
  @Input() contactUs: ContactUsSM | null = null;
  isSubmitting = false;
  selectedFile: File | null = null;

  constructor(
    commonService: CommonService,
    private logHandler: LogHandlerService,
    private contactUsService: ContactUsService,
    public activeModal: NgbActiveModal,
  ) {
    super(commonService, logHandler);
    this.viewModel = new ContactUsViewModel();
  }

  ngOnInit() {
    if (this.contactUs) {
      this.getcontactUsById(this.contactUs.id);
    }
  }


  async onSubmit(form: any): Promise<void> {
    this.viewModel.FormSubmitted = true;
    if (form.invalid) return;
    this.isSubmitting = true;
    try {
      if (this.contactUs && this.contactUs.id) {
        await this.updatecontactUs();
      } else {
        await this.addcontactUs();
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  private async addcontactUs() {
    try {
      this._commonService.presentLoading();
      const formData = new FormData();
      // formData.append("reqData", JSON.stringify(this.viewModel.contactUsFormData));
      const resp = await this.contactUsService.addContactUs(this.viewModel.contactUsFormData);
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
          text: 'contactUs added successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to add contactUs.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async updatecontactUs() {
    try {
      this._commonService.presentLoading();
      const resp = await this.contactUsService.updateContactUs(this.viewModel.contactUsFormData);
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
          text: 'contactUs updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to update contactUs.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async getcontactUsById(id: number) {
    try {
      this._commonService.presentLoading();
      const resp = await this.contactUsService.getContactUsById(id);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.contactUsFormData = resp.successData;
        console.log('contactUs details loaded:', this.viewModel.contactUsFormData);
        
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load contactUs details.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }
}

