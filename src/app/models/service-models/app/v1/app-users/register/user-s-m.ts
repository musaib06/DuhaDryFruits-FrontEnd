import { WildValleyFoodsServiceModelBase } from "../../../base/WildValleyFoods-service-model-base";

export class UserSM extends WildValleyFoodsServiceModelBase<number> {
  username!: string;
  email!: string;
  password!: string;
  refereshToken?: string;
  accessToken?: string;
  role!: 'superAdmin' | 'Vendor' | 'endUser' | 'Researcher';
}
