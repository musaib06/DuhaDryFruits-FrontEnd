import { DuhaDryFruitsServiceModelBase } from "../../../base/DuhaDryFruits-service-model-base";

export class UserSM extends DuhaDryFruitsServiceModelBase<number> {
  username!: string;
  email!: string;
  password!: string;
  refereshToken?: string;
  accessToken?: string;
  role!: 'superAdmin' | 'Vendor' | 'endUser' | 'Researcher';
}
