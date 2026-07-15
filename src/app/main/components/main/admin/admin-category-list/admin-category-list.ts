import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../base.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CategorySM } from '../../../../../models/service-models/app/v1/categories-s-m';
import { AdminCategoriesViewModel } from '../../../../../models/view/Admin/admin.categories.viewmodel';
import { CategoryService } from '../../../../../services/category.service';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../internal/pagination/pagination.component';
import { AdminCategoryForm } from './admin-category-form/admin-category-form';
import { resolveCategoryIcon } from '../../../../../utils/image-url.util';

@Component({
  selector: 'app-admin-category-list',
  imports: [CommonModule,FormsModule,PaginationComponent],
  templateUrl: './admin-category-list.html',
  styleUrl: './admin-category-list.scss'
})
export class AdminCategoryList extends BaseComponent<AdminCategoriesViewModel> implements OnInit {
    protected _logHandler: LogHandlerService;
  constructor(commonService:CommonService,logHandler:LogHandlerService, private modalService: NgbModal,private categoryService: CategoryService) {
    super(commonService,logHandler);
    this._logHandler = logHandler;
    this.viewModel = new AdminCategoriesViewModel();
  }
  // categories: Category[] = [];
  // filteredCategories: Category[] = [];

  ngOnInit(){
this.loadPageData()
  }

  // Additional methods for handling categories can be added here
   override async loadPageData(){
     try {
      this._commonService.presentLoading();
      let resp=await this.categoryService.getAllCategories(this.viewModel);
      if(resp.isError){
       await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
      else{
        this.viewModel.categories = resp.successData;
        console.log('Categories loaded:', this.viewModel.categories);
          //     this.categories = data;
         this.viewModel.filteredCategories = [...resp.successData];
         this.sortData();
         this.TotalCategoryCount();
      }

     } catch (error) {
      
        await this._logHandler.logObject(error);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Failed to load categories.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    
     finally{
      this._commonService.dismissLoader();
     }
  }

    /**this function is used to create an event for pagination */
  async loadPagedataWithPagination(pageNumber: number) {
    if (pageNumber && pageNumber > 0) {
      // this.viewModel.PageNo = pageNumber;
      this.viewModel.pagination.PageNo = pageNumber;
      await this.loadPageData();
    }
  }
 applyFilter(): void {
    if (!this.viewModel.searchTerm) {
      this.viewModel.filteredCategories = [...this.viewModel.categories];
    } else {
      const term = this.viewModel.searchTerm.toLowerCase();
      this.viewModel.filteredCategories  = this.viewModel.categories.filter(cat => 
        cat.name.toLowerCase().includes(term) || 
        (cat.description && cat.description.toLowerCase().includes(term))
      );
    }
    this.sortData();
  }

  sortData(field?: string): void {
    if (field) {
      if (this.viewModel.sortField === field) {
        this.viewModel.sortDirection = this.viewModel.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.viewModel.sortField = field;
        this.viewModel.sortDirection = 'asc';
      }
    }
    
    this.viewModel.filteredCategories.sort((a, b) => {
      let valueA = a[this.viewModel.sortField as keyof CategorySM];
      let valueB = b[this.viewModel.sortField as keyof CategorySM];
      
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      
      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return this.viewModel.sortDirection === 'asc' ? 1 : -1;
      if (valueB === undefined) return this.viewModel.sortDirection === 'asc' ? -1 : 1;
      if (valueA < valueB) return this.viewModel.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.viewModel.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(field: string): string {
    if (this.viewModel.sortField !== field) return 'bi-sort';
    return this.viewModel.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  async TotalCategoryCount(){
    try {
      this._commonService.presentLoading();
      let resp = await this.categoryService.getTotatCategoryCount();
      if (resp.isError) {
        await this._logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.pagination.totalCount = resp.successData.intResponse;
        console.log(this.viewModel.pagination.totalCount)
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load total category count.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  
openFormModal(category?: CategorySM): void {
    const modalRef = this.modalService.open(AdminCategoryForm, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.category = category || null;    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadPageData();
      }
    }).catch(() => {});
  }

  confirmDelete(id: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(id);
         this.loadPageData();
    }
  }

  categoryIcon(category: CategorySM): string {
    return resolveCategoryIcon(category);
  }
}