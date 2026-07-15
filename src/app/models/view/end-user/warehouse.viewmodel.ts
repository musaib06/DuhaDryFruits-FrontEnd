import { FormGroup } from '@angular/forms';
import { BaseViewModel } from '../../internal/base.viewmodel';
import { WareHouseSM } from '../../service-models/app/v1/warehouse-s-m';

export class WarehouseViewModel extends BaseViewModel {
  warehouses: WareHouseSM[] = [];
  displayStyle: string = 'none';
  AddEditWarehouseModalTitle: string = '';
  warehouse = new WareHouseSM();
  warehouseForm!: FormGroup;
  isEditMode!:boolean;
  storageTypes: { key: string; value: number }[] = [];

  isToggled = false;
  //   farmFormValidations = {

  //     farmName: [
  //       { type: 'required', message: 'Farm Name  is Required !' },
  //       { type: 'minlength', value: 2, message: 'Minimum Length is 2 Characters !' },
  //       { type: 'maxlength', value: 30, message: 'Maximum Length is 20 Characters !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     country: [
  //       { type: 'required', message: 'Country is Required !' },
  //       { type: 'minlength', value: 3, message: 'Minimum Length is 3 Characters !' },
  //       { type: 'maxlength', value: 30, message: 'Maximum Length is 20 Characters !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     state: [
  //       { type: 'required', message: 'State is Required !' },
  //       { type: 'minlength', value: 3, message: 'Minimum Length is 3 Characters !' },
  //       { type: 'maxlength', value: 30, message: 'Maximum Length is 30 Characters !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     street: [
  //       { type: 'required', message: 'street is Required !' },
  //       { type: 'minlength', value: 3, message: 'Minimum Length is 3 Characters !' },
  //       { type: 'maxlength', value: 30, message: 'Maximum Length is 30 Characters !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     city: [
  //       { type: 'required', message: 'City is Required !' },
  //       { type: 'minlength', value: 3, message: 'Minimum Length is 3 Characters !' },
  //       { type: 'maxlength', value: 30, message: 'Maximum Length is 30 Characters !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     pinCode: [
  //       { type: 'required', message: 'Pin Code is Required !' },
  //       { type: 'minlength', value: 4, message: 'Minimum Length is 4 Characters !' },
  //       { type: 'maxlength', value: 12, message: 'Maximum Length is 12 Characters !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ]
  //   };

  //   cropFarmValidations = {
  //     cropName: [
  //       { type: 'required', message: 'Crop Name  is Required !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     cropType: [
  //       { type: 'required', message: 'Crop Type  is Required !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     plantationDate: [
  //       { type: 'required', message: 'Plantation Date  is Required !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     seasonEndDate: [
  //       { type: 'required', message: 'SessionEnd Date  is Required !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     firstFlowerBudDate: [
  //       { type: 'required', message: 'Budd Date  is Required !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ],
  //     actualYield: [
  //       { type: 'required', message: 'Actual Yield  is Required !' },
  //       { type: 'pattern', message: 'Not Valid Format !' }
  //     ]
  //   };
}
