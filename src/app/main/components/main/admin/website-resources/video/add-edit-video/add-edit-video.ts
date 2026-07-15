import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseComponent } from '../../../../../../../base.component';
import { CommonService } from '../../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../../services/log-handler.service';
import { VideoViewModel } from '../../../../../../../models/view/website-resource/video.viewmodel';
import { VideoSM } from '../../../../../../../models/service-models/app/v1/website-resource/video-s-m';
import { VideoService } from '../../../../../../../services/video.service';
import { ProductService } from '../../../../../../../services/product.service';
import { ProductNameIdSM } from '../../../../../../../models/service-models/app/v1/product-name-id-s-m';
@Component({
  selector: 'app-add-edit-video',
    imports: [CommonModule, FormsModule],
  templateUrl: './add-edit-video.html',
  styleUrl: './add-edit-video.scss'
})

export class AddEditVideo extends BaseComponent<VideoViewModel> implements OnInit {
  @Input() Video: VideoSM | null = null;
  isSubmitting = false;
  selectedFile: File | null = null;
  products: ProductNameIdSM[] = [];

  constructor(
    commonService: CommonService,
    private logHandler: LogHandlerService,
    private videoService: VideoService,
    private productService: ProductService,
    public activeModal: NgbActiveModal,
  ) {
    super(commonService, logHandler);
    this.viewModel = new VideoViewModel();
  }

  ngOnInit() {
    this.loadProducts();
    if (this.Video) {
      this.getVideoById(this.Video.id);
    }
  }

  async loadProducts() {
    try {
      const resp = await this.productService.getAllProductNamesOnly();
      if (!resp.isError && resp.successData) {
        this.products = resp.successData;
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }


  async onSubmit(form: any): Promise<void> {
    this.viewModel.FormSubmitted = true;
    if (form.invalid) return;
    this.isSubmitting = true;
    try {
      if (this.Video && this.Video.id) {
        await this.updateVideo();
      } else {
        await this.addVideo();
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  private async addVideo() {
    try {
      this._commonService.presentLoading();
      const formData = new FormData();
      // formData.append("reqData", JSON.stringify(this.viewModel.VideoFormData));
      const resp = await this.videoService.addVideo(this.viewModel.VideoFormData);
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
          text: 'Video added successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to add Video.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async updateVideo() {
    try {
      this._commonService.presentLoading();
      const resp = await this.videoService.updateVideo(this.viewModel.VideoFormData);
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
          text: 'Video updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to update Video.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async getVideoById(id: number) {
    try {
      this._commonService.presentLoading();
      const resp = await this.videoService.getVideoById(id);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.VideoFormData = resp.successData;
        console.log('Video details loaded:', this.viewModel.VideoFormData);
        
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load Video details.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }
}


