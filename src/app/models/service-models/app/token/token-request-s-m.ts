import { TokenRequestRoot } from '../../foundation/token/token-request-root';
import { RoleTypeSM } from '../enums/role-type-s-m.enum';

export class TokenRequestSM extends TokenRequestRoot {
    companyCode!: string;
    roleType!: RoleTypeSM;
    isAdmin:boolean=false;
}
