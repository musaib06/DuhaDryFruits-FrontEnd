import { WildValleyFoodsServiceModelBase } from '../base/WildValleyFoods-service-model-base';
import { StorageTypeSM } from '../enums/warehouse-storage-type-s-m.enum';

export class WareHouseSM extends WildValleyFoodsServiceModelBase<number> {
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
