import { Component, Input, OnInit } from '@angular/core';
import { BannerSM } from '../../../../../../../models/service-models/app/v1/website-resource/banner-s-m';
import { BannerViewModel } from '../../../../../../../models/view/website-resource/banner.viewmodel';
import { BaseComponent } from '../../../../../../../base.component';
import { CommonService } from '../../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../../services/log-handler.service';
import { BannerService } from '../../../../../../../services/banner.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { resolveBannerImage } from '../../../../../../../utils/image-url.util';
import {
  acceptedImageFileMessage,
  canPreviewImageFileInBrowser,
  isAcceptedImageFile,
  isImageFileTooLarge,
  maxImageUploadSizeLabel,
} from '../../../../../../../utils/image-file.util';

@Component({
  selector: 'app-admin-website-resources',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-website-resources.html',
  styleUrl: './admin-website-resources.scss'
})
export class AdminWebsiteResources extends BaseComponent<BannerViewModel> implements OnInit {
  @Input() banner: BannerSM | null = null;
  isSubmitting = false;
  selectedFile: File | null = null;
  imagePreviewUrl = '';

  constructor(
    private commonService: CommonService,
    private logHandler: LogHandlerService,
    private bannerService: BannerService,
    public activeModal: NgbActiveModal,
  ) {
    super(commonService, logHandler);
    this.viewModel = new BannerViewModel();
  }

  ngOnInit() {
    if (this.banner) {
      this.getBannerById(this.banner.id);
    } else {
      this.viewModel.bannerFormData.isVisible = true;
      this.viewModel.bannerFormData.sequence = 0;
    }
  }

   onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    if (isImageFileTooLarge(file)) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: `Image size should be less than ${maxImageUploadSizeLabel()}`,
        icon: 'error',
        confirmButtonText: 'OK',
      });
      event.target.value = '';
      return;
    }
    if (!isAcceptedImageFile(file)) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: acceptedImageFileMessage(),
        icon: 'error',
        confirmButtonText: 'OK',
      });
      event.target.value = '';
      return;
    }
    this.selectedFile = file;
    this.imagePreviewUrl = canPreviewImageFileInBrowser(file) ? URL.createObjectURL(file) : '';
  }

  hasBannerImage(): boolean {
    return !!this.selectedFile || !!this.viewModel.bannerFormData?.imagePath || !!this.viewModel.bannerFormData?.imageUrl;
  }

  getBannerPreview(): string {
    if (this.imagePreviewUrl) return this.imagePreviewUrl;
    return resolveBannerImage(this.viewModel.bannerFormData, '');
  }

  async onSubmit(form: any): Promise<void> {
    this.viewModel.FormSubmitted = true;
    if (form.invalid) return;
    this.viewModel.bannerFormData.sequence = Number(this.viewModel.bannerFormData.sequence ?? 0);

    this.isSubmitting = true;
    try {
      if (this.banner && this.banner.id) {
        await this.updateBanner();
      } else {
        await this.addBanner();
      }
    } finally {
      this.isSubmitting = false;
    }
  }

private async addBanner() {
  try {
    this._commonService.presentLoading();
     const formData = new FormData();
     const payload = {
       title: this.viewModel.bannerFormData.title || null,
       description: this.viewModel.bannerFormData.description || null,
       link: this.viewModel.bannerFormData.link || null,
       ctaText: this.viewModel.bannerFormData.ctaText || null,
       bannerType: this.viewModel.bannerFormData.bannerType || 'Slider',
       isVisible: this.viewModel.bannerFormData.isVisible !== false,
       sequence: Number(this.viewModel.bannerFormData.sequence ?? 0),
     };
      formData.append("reqData", JSON.stringify(payload));
    if (this.selectedFile) {
      formData.append("imagePath", this.selectedFile);
    } else {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Please select a banner image to upload.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

      const resp = await this.bannerService.addBanner(formData);
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
          text: 'Banner added successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to add banner.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async updateBanner() {
    try {
      this._commonService.presentLoading();
      const formData = new FormData();
      const payload = {
        title: this.viewModel.bannerFormData.title || null,
        description: this.viewModel.bannerFormData.description || null,
        link: this.viewModel.bannerFormData.link || null,
        ctaText: this.viewModel.bannerFormData.ctaText || null,
        bannerType: this.viewModel.bannerFormData.bannerType || 'Slider',
        isVisible: this.viewModel.bannerFormData.isVisible !== false,
        sequence: Number(this.viewModel.bannerFormData.sequence ?? 0),
      };
      formData.append("reqData", JSON.stringify(payload));
      if (this.selectedFile) {
        formData.append("imagePath", this.selectedFile);
      }
      const resp = await this.bannerService.updateBanner(formData, this.viewModel.bannerFormData.id);
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
          text: 'Banner updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to update banner.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async getBannerById(id: number) {
    try {
      this._commonService.presentLoading();
      const resp = await this.bannerService.getBannerById(id);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.bannerFormData = resp.successData;
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load banner details.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }
}
