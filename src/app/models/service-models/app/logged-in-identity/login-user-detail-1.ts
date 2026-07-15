import { LoginUserDetail as LoginUserDetail1 } from './login-user-detail';
import { RoleTypeSM } from '../enums/role-type-s-m.enum';

export class LoginUserDetail implements LoginUserDetail1 {
    dbRecordId!: number;
    loginId!: string;
    userType!: RoleTypeSM;
}
