import { BaseViewModel } from '../../internal/base.viewmodel';
import { UnitsSM } from '../../service-models/app/v1/units-s-m';

export class AdminUnitsViewModel extends BaseViewModel {
  fileName: string = '';
  updateMode: boolean = false;
  UnitsFormData:UnitsSM=new UnitsSM()
  singleUnits = new UnitsSM();
  Units: UnitsSM[] = [];
  filteredUnits: UnitsSM[] = [];
  searchTerm = '';
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
}
