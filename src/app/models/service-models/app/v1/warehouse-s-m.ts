import { DuhaDryFruitsServiceModelBase } from '../base/DuhaDryFruits-service-model-base';
import { StorageTypeSM } from '../enums/warehouse-storage-type-s-m.enum';

export class WareHouseSM extends DuhaDryFruitsServiceModelBase<number> {
  name!: string;
  description!: string;
  location!: string;
  contactNumber!: string;
  emailId!: string;
  storageType!: StorageTypeSM;
  capacity!: number;
  isActive!: boolean;
  clientCompanyDetailId?: number;
}
