import { FormGroup } from "@angular/forms";
import { BaseViewModel } from "../../internal/base.viewmodel";
import { UserSM } from "../../service-models/app/v1/app-users/register/user-s-m";

export class signUpViewModel  extends BaseViewModel{
    userSM:UserSM=new UserSM();
    signupForm!: FormGroup;
    showPassword = false;
    showConfirmPassword = false;
}