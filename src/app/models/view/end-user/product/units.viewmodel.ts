import { BaseViewModel } from "../../../internal/base.viewmodel";
import { UnitsSM } from "../../../service-models/app/v1/units-s-m";

export class UnitsViewModel extends BaseViewModel{
    units: UnitsSM[] = [];
    unit: UnitsSM = new UnitsSM();
     updateMode: boolean = false;
}