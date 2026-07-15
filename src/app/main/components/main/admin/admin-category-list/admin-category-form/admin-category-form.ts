import { Component, Input, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../../base.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategorySM } from '../../../../../../models/service-models/app/v1/categories-s-m';
import { AdminCategoriesViewModel } from '../../../../../../models/view/Admin/admin.categories.viewmodel';
import { CategoryService } from '../../../../../../services/category.service';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { resolveCategoryIcon } from '../../../../../../utils/image-url.util';
import {
  acceptedImageFileMessage,
  canPreviewImageFileInBrowser,
  isAcceptedImageFile,
  isImageFileTooLarge,
  maxImageUploadSizeLabel,
} from '../../../../../../utils/image-file.util';

@Component({
  selector: 'app-admin-category-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-category-form.html',
  styleUrl: './admin-category-form.scss'
})
export class AdminCategoryForm extends BaseComponent<AdminCategoriesViewModel> implements OnInit {
  @Input() category: CategorySM | null = null;
  isSubmitting = false;
  selectedFile: File | null = null;
  iconPreviewUrl = '';

  constructor(
    commonService: CommonService,
    private logHandler: LogHandlerService,
    private categoryService: CategoryService,
    public activeModal: NgbActiveModal,
  ) {
    super(commonService, logHandler);
    this.viewModel = new AdminCategoriesViewModel();
  }

  ngOnInit() {
    if (this.category) {
      this.getCategoryById(this.category.id);
    } else {
      this.viewModel.categoryFormData.status = 'active';
      this.viewModel.categoryFormData.slider = false;
      this.viewModel.categoryFormData.sequence = 0;
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
    this.iconPreviewUrl = canPreviewImageFileInBrowser(file) ? URL.createObjectURL(file) : '';
  }

  hasCategoryIcon(): boolean {
    return !!this.selectedFile || !!this.viewModel.categoryFormData?.category_icon || !!this.viewModel.categoryFormData?.category_icon_url;
  }

  getCategoryIconPreview(): string {
    if (this.iconPreviewUrl) return this.iconPreviewUrl;
    return resolveCategoryIcon(this.viewModel.categoryFormData, '');
  }

  async onSubmit(form: any): Promise<void> {
    this.viewModel.FormSubmitted = true;
    if (form.invalid) return;
    this.isSubmitting = true;
    try {
      if (this.category && this.category.id) {
        await this.updateCategory();
      } else {
        await this.addCategory();
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  private async addCategory() {
    try {
      this._commonService.presentLoading();
      const formData = new FormData();
      formData.append("reqData", JSON.stringify(this.viewModel.categoryFormData));
      if (this.selectedFile) {
        formData.append("category_icon", this.selectedFile);
      }

      const resp = await this.categoryService.addCategory(formData);
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
          text: 'Category added successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to add category.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async updateCategory() {
    try {
      this._commonService.presentLoading();
      const formData = new FormData();
      formData.append("reqData", JSON.stringify(this.viewModel.categoryFormData));
      if (this.selectedFile) {
        formData.append("category_icon", this.selectedFile);
      }

      const resp = await this.categoryService.updateCategory(formData, this.viewModel.categoryFormData.id);
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
          text: 'Category updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to update category.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async getCategoryById(id: number) {
    try {
      this._commonService.presentLoading();
      const resp = await this.categoryService.getCategoryById(id);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.categoryFormData = resp.successData;
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load category details.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }
}
