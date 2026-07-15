import { Component, Input, OnInit } from '@angular/core';
import { BaseComponent } from '../../../../../../base.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from '../../../../../../services/common.service';
import { LogHandlerService } from '../../../../../../services/log-handler.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UnitsSM } from '../../../../../../models/service-models/app/v1/units-s-m';
import { AdminUnitsViewModel } from '../../../../../../models/view/Admin/admin.units.viewmodel';
import { UnitsService } from '../../../../../../services/unit.service';

@Component({
  selector: 'app-admin-unit-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-unit-form.html',
  styleUrl: './admin-unit-form.scss'
})
export class AdminunitsForm extends BaseComponent<AdminUnitsViewModel> implements OnInit {
  @Input() unit: UnitsSM | null = null;
  isSubmitting = false;
  selectedFile: File | null = null;

  constructor(
    commonService: CommonService,
    private logHandler: LogHandlerService,
    private unitsService: UnitsService,
    public activeModal: NgbActiveModal,
  ) {
    super(commonService, logHandler);
    this.viewModel = new AdminUnitsViewModel();
  }

  ngOnInit() {
    if (this.unit) {
      this.getunitsById(this.unit.id);
    } else {
      // this.viewModel.UnitsFormData.status = 'active';
      // this.viewModel.UnitsFormData.slider = false;
      // this.viewModel.UnitsFormData.sequence = 0;
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onSubmit(form: any): Promise<void> {
    this.viewModel.FormSubmitted = true;
    if (form.invalid) return;
    this.isSubmitting = true;
    try {
      if (this.unit && this.unit.id) {
        await this.updateunits();
      } else {
        await this.addunits();
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  private async addunits() {
    try {
      this._commonService.presentLoading();
      debugger
      const resp = await this.unitsService.addUnits(this.viewModel.UnitsFormData);
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
          text: 'units added successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to add units.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async updateunits() {
    try {
      this._commonService.presentLoading();
      const formData = new FormData();
      formData.append("reqData", JSON.stringify(this.viewModel.UnitsFormData));
      if (this.selectedFile) {
        formData.append("units_icon", this.selectedFile);
      }

      const resp = await this.unitsService.updateUnits(this.viewModel.UnitsFormData);
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
          text: 'units updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        this.activeModal.close('saved');
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to update units.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }

  private async getunitsById(id: number) {
    try {
      this._commonService.presentLoading();
      const resp = await this.unitsService.getUnitsById(id);
      if (resp.isError) {
        await this.logHandler.logObject(resp.errorData);
        this._commonService.showSweetAlertToast({
          title: 'Error',
          text: resp.errorData.displayMessage,
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else {
        this.viewModel.UnitsFormData = resp.successData;
      }
    } catch (error) {
      await this.logHandler.logObject(error);
      this._commonService.showSweetAlertToast({
        title: 'Error',
        text: 'Failed to load units details.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      this._commonService.dismissLoader();
    }
  }
}
