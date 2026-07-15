import { TokenResponseRoot } from '../../foundation/token/token-response-root';
import { LoginUserSM } from '../v1/app-users/login/login-user-s-m';

export class TokenResponseSM extends TokenResponseRoot {
    loginUserDetails!: LoginUserSM;
    clientCompanyId!: number;
}
