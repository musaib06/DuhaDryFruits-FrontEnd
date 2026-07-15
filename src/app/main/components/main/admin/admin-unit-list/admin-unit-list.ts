import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../base.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from '../../../../../services/common.service';
import { LogHandlerService } from '../../../../../services/log-handler.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../internal/pagination/pagination.component';
import { UnitsService } from '../../../../../services/unit.service';
import { UnitsSM } from '../../../../../models/service-models/app/v1/units-s-m';
import { AdminunitsForm } from './admin-unit-form/admin-unit-form';
import { AdminUnitsViewModel } from '../../../../../models/view/Admin/admin.units.viewmodel';

@Component({
  selector: 'app-admin-unit-list',
  imports: [CommonModule,FormsModule,PaginationComponent],
  templateUrl: './admin-unit-list.html',
  styleUrl: './admin-unit-list.scss'
})
export class AdminUnitList extends BaseComponent<AdminUnitsViewModel> implements OnInit {
    protected _logHandler: LogHandlerService;
  constructor(commonService:CommonService,logHandler:LogHandlerService, private modalService: NgbModal,private unitService: UnitsService) {
    super(commonService,logHandler);
    this._logHandler = logHandler;
    this.viewModel = new AdminUnitsViewModel();
  }
  // Units: unit[] = [];
  // filteredUnits: unit[] = [];

  ngOnInit(){
this.loadPageData()
  }

  // Additional methods for handling Units can be added here
   override async loadPageData(){
     try {
      this._commonService.presentLoading();
      let resp=await this.unitService.getAllPaginatedUnits(this.viewModel);
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
        this.viewModel.Units = resp.successData;
        // console.log('Units loaded:', this.viewModel.Units);
          //     this.Units = data;
         this.viewModel.filteredUnits = [...resp.successData];
        this.applyFilterAndSort();
         this.TotalunitCount();
      }

     } catch (error) {
      
        await this._logHandler.logObject(error);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: 'Failed to load Units.',
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
  this.applyFilterAndSort();
}

  applyFilterAndSort(): void {
  const term = this.viewModel.searchTerm?.toLowerCase() || '';

  // 1️⃣ Filter
  let data = [...this.viewModel.Units];

  if (term) {
    data = data.filter(u =>
      u.name?.toLowerCase().includes(term) ||
      u.symbol?.toLowerCase().includes(term)
    );
  }

  // 2️⃣ Sort
  const field = this.viewModel.sortField as keyof UnitsSM;
  const direction = this.viewModel.sortDirection === 'asc' ? 1 : -1;

  data.sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];

    if (typeof valueA === 'string') valueA = valueA.toLowerCase();
    if (typeof valueB === 'string') valueB = valueB.toLowerCase();

    if (valueA == null) return 1 * direction;
    if (valueB == null) return -1 * direction;

    return valueA > valueB ? direction : -direction;
  });

  this.viewModel.filteredUnits = data;
}


 sortData(field: keyof UnitsSM): void {
  if (this.viewModel.sortField === field) {
    this.viewModel.sortDirection =
      this.viewModel.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.viewModel.sortField = field;
    this.viewModel.sortDirection = 'asc';
  }

  this.applyFilterAndSort();
}


  getSortIcon(field: string): string {
    if (this.viewModel.sortField !== field) return 'bi-sort';
    return this.viewModel.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  async TotalunitCount(){
    try {
      this._commonService.presentLoading();
      let resp = await this.unitService.getTotalUnitsCount();
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
        // console.log(this.viewModel.pagination.totalCount)
      }
    } catch (error) {
      await this._logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load total unit count.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  
async openFormModal(unit?: UnitsSM) {
    const modalRef = this.modalService.open(AdminunitsForm, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.unit = unit || null;    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.viewModel.pagination.PageNo = 1;
        this.loadPageData();
      }
    }).catch(() => {});
  }

async confirmDelete(id: number) {
    if (confirm('Are you sure you want to delete this unit?')) {
     await this.unitService.deleteUnits(id);
         this.loadPageData();
    }
  }
}