import { FormGroup } from "@angular/forms";
import { BaseViewModel } from "../../internal/base.viewmodel";
import { TokenRequestSM } from "../../service-models/app/token/token-request-s-m";
import { LoginUserSM } from "../../service-models/app/v1/app-users/login/login-user-s-m";

export class LoginViewModel extends BaseViewModel{
    userLogin:TokenRequestSM= new TokenRequestSM();
    hide = true;
    authForm!: FormGroup;
    rememberMe:boolean=false;
    isToggled = false;
}