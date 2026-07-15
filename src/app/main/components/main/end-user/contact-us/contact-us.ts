import { Component, OnInit } from '@angular/core';
import { ContactUsViewModel } from '../../../../../models/view/Admin/contact-us.viewmodel';
import { BaseComponent } from '../../../../../base.component';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { ContactUsService } from '../../../../../services/contact-us.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-us',
  imports: [CommonModule,FormsModule],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.scss'
})
export class ContactUs extends BaseComponent<ContactUsViewModel> implements OnInit {
  isSubmitting = false;
  constructor(
    commonService: CommonService,
    private logHandler: LogHandlerService,
    private contactUsService: ContactUsService,
  ) {
    super(commonService, logHandler);
    this.viewModel = new ContactUsViewModel();
  }

  ngOnInit() {
  }

  async addcontactUs() {
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



}

