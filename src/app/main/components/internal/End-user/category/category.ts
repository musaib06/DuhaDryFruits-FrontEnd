import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CategoriesViewModel } from '../../../../../models/view/end-user/product/categories.viewmodel';
import { BaseComponent } from '../../../../../base.component';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { Router } from '@angular/router';
import { CategoryService } from '../../../../../services/category.service';
import { resolveCategoryIcon } from '../../../../../utils/image-url.util';
import { AdminCategoriesViewModel } from '../../../../../models/view/Admin/admin.categories.viewmodel';

@Component({
  selector: 'app-category',
  templateUrl: './category.html',
  styleUrls: ['./category.scss'],
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryComponent extends BaseComponent<AdminCategoriesViewModel> {
  constructor(
    commonService: CommonService,
    logHandlerService: LogHandlerService,
    private router: Router,
    private categoryService: CategoryService,
  ) {
    super(commonService, logHandlerService);
    this.viewModel = new AdminCategoriesViewModel();
  }

  @Input() categories: any[] = [];

  trackById(_: number, item: any) {
    return item.id ?? item.name;
  }

  categoryIconSrc(c: any): string {
    return resolveCategoryIcon(c);
  }

  private sortCategoriesBySequence(categories: any[]): any[] {
    return [...(categories || [])].sort((a, b) => {
      const aSeq = Number(a?.sequence ?? 0);
      const bSeq = Number(b?.sequence ?? 0);
      if (aSeq !== bSeq) return aSeq - bSeq;
      return String(a?.name || '').localeCompare(String(b?.name || ''));
    });
  }

   async getAllCategories(): Promise<void> {
    try {
      let resp = await this.categoryService.getAllCategories(
        this.viewModel
      );
      if (resp.isError) {
        await this._exceptionHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.categories = this.sortCategoriesBySequence(resp.successData || []);
      }
    } catch (error) {
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'An error occurred',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }
}
