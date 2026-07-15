import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BaseComponent } from '../../../../../../base.component';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { ProductService } from '../../../../../../services/product.service';
import { ProductSM } from '../../../../../../models/service-models/app/v1/product-s-m';
import { ProductFaqSM } from '../../../../../../models/service-models/app/v1/product-faq-s-m';
import {
  AdminProductFaqViewModel,
  AdminProductFaqFormData,
} from '../../../../../../models/view/Admin/admin.product-faq.viewmodel';

@Component({
  selector: 'app-admin-product-faq',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-product-faq.html',
  styleUrl: './admin-product-faq.scss',
})
export class AdminProductFaq
  extends BaseComponent<AdminProductFaqViewModel>
  implements OnInit
{
  @Input() product: ProductSM | null = null;
  isSubmitting = false;
  isReordering = false;

  constructor(
    commonService: CommonService,
    private logHandler: LogHandlerService,
    private productService: ProductService,
    public activeModal: NgbActiveModal,
  ) {
    super(commonService, logHandler);
    this.viewModel = new AdminProductFaqViewModel();
  }

  ngOnInit(): void {
    if (this.product?.id) {
      this.loadFaqs();
    }
  }

  get productName(): string {
    return this.product?.name || 'Product';
  }

  async loadFaqs(): Promise<void> {
    if (!this.product?.id) return;
    try {
      this._commonService.presentLoading();
      const resp = await this.productService.getAdminFaqs(this.product.id);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.faqs = (resp.successData || []).sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
        );
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load FAQs.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  startAdd(): void {
    const nextOrder =
      this.viewModel.faqs.length > 0
        ? Math.max(...this.viewModel.faqs.map((f) => f.displayOrder ?? 0)) + 1
        : 1;
    this.viewModel.faqFormData = new AdminProductFaqFormData();
    this.viewModel.faqFormData.displayOrder = nextOrder;
    this.viewModel.faqFormData.isActive = true;
    this.viewModel.isEditing = false;
    this.viewModel.isFormVisible = true;
    this.viewModel.FormSubmitted = false;
  }

  startEdit(faq: ProductFaqSM): void {
    this.viewModel.faqFormData = {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      displayOrder: faq.displayOrder ?? 0,
      isActive: faq.isActive,
    };
    this.viewModel.isEditing = true;
    this.viewModel.isFormVisible = true;
    this.viewModel.FormSubmitted = false;
  }

  cancelForm(): void {
    this.viewModel.isFormVisible = false;
    this.viewModel.FormSubmitted = false;
    this.viewModel.faqFormData = new AdminProductFaqFormData();
  }

  async onSubmit(form: any): Promise<void> {
    this.viewModel.FormSubmitted = true;
    if (form.invalid || !this.product?.id) return;

    const payload: Partial<ProductFaqSM> = {
      question: (this.viewModel.faqFormData.question || '').trim(),
      answer: (this.viewModel.faqFormData.answer || '').trim(),
      displayOrder: Number(this.viewModel.faqFormData.displayOrder) || 0,
      isActive: !!this.viewModel.faqFormData.isActive,
    };

    this.isSubmitting = true;
    try {
      this._commonService.presentLoading();
      const resp = this.viewModel.isEditing
        ? await this.productService.updateFaq(this.viewModel.faqFormData.id, payload)
        : await this.productService.addFaq(this.product.id, payload);

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
          text: this.viewModel.isEditing ? 'FAQ updated successfully.' : 'FAQ added successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.cancelForm();
        await this.loadFaqs();
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to save FAQ.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this.isSubmitting = false;
      this._commonService.dismissLoader();
    }
  }

  async toggleStatus(faq: ProductFaqSM): Promise<void> {
    try {
      this._commonService.presentLoading();
      const resp = await this.productService.setFaqStatus(faq.id, !faq.isActive);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        faq.isActive = !faq.isActive;
      }
    } catch (error) {
      await this.logHandler.logObject(error);
    } finally {
      this._commonService.dismissLoader();
    }
  }

  async confirmDelete(faq: ProductFaqSM): Promise<void> {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      this._commonService.presentLoading();
      const resp = await this.productService.deleteFaq(faq.id);

      // A "not found" means the FAQ was already removed on the server (e.g. a
      // previous delete succeeded but the table didn't refresh). Treat it the
      // same as success so the row always disappears instead of getting stuck.
      const alreadyGone =
        resp.isError &&
        /not\s*found/i.test(resp.errorData?.displayMessage || '');

      if (resp.isError && !alreadyGone) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        // Remove locally straight away so the table reflects the deletion
        // immediately, then re-sync from the server in the background.
        this.viewModel.faqs = this.viewModel.faqs.filter((f) => f.id !== faq.id);
        this._commonService.showSweetAlertToast({
          title: 'Success',
          text: 'FAQ deleted successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      }
    } catch (error) {
      await this.logHandler.logObject(error);
    } finally {
      this._commonService.dismissLoader();
    }
  }

  async moveUp(index: number): Promise<void> {
    if (index <= 0) return;
    await this.swapAndPersist(index, index - 1);
  }

  async moveDown(index: number): Promise<void> {
    if (index >= this.viewModel.faqs.length - 1) return;
    await this.swapAndPersist(index, index + 1);
  }

  private async swapAndPersist(from: number, to: number): Promise<void> {
    if (!this.product?.id || this.isReordering) return;
    const faqs = [...this.viewModel.faqs];
    const temp = faqs[from];
    faqs[from] = faqs[to];
    faqs[to] = temp;
    this.viewModel.faqs = faqs;

    const orderedIds = faqs.map((f) => f.id);
    this.isReordering = true;
    try {
      const resp = await this.productService.reorderFaqs(this.product.id, orderedIds);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
        await this.loadFaqs();
      } else {
        this.viewModel.faqs = (resp.successData || []).sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
        );
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      await this.loadFaqs();
    } finally {
      this.isReordering = false;
    }
  }
}
