import { FormGroup } from "@angular/forms";
import { BaseViewModel } from "../../internal/base.viewmodel";
import { UserSM } from "../../service-models/app/v1/app-users/register/user-s-m";

export class AuthViewModel  extends BaseViewModel{
    userSM:UserSM=new UserSM();
    loginForm!: FormGroup;
    loginObj = new loginUserDetails();
    rememberMe: boolean = false;
}

export class loginUserDetails {
    username: string = '';
    password: string = '';
    role: string = '';
}