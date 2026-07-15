import { RoleTypeSM } from '../enums/role-type-s-m.enum';

export interface LoginUserDetail {
    dbRecordId: number;
    loginId: string;
    userType: RoleTypeSM;
}
