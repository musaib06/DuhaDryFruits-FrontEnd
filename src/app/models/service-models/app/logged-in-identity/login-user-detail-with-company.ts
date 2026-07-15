import { LoginUserDetail } from './login-user-detail';
import { RoleTypeSM } from '../enums/role-type-s-m.enum';

export class LoginUserDetailWithCompany implements LoginUserDetail {
    dbRecordId!: number;
    loginId!: string;
    companyRecordId!: number;
    companyCode!: string;
    userType!: RoleTypeSM;
}
