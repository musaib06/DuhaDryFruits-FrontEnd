import { LoginUserSM } from './login/login-user-s-m';
import { GenderSM } from '../../enums/gender-s-m.enum';

export class ClientUserSM extends LoginUserSM {
    gender!: GenderSM;
    personalEmailId!: string;
    clientUserAddressId?: number;
    clientCompanyDetailId!: number;
}
