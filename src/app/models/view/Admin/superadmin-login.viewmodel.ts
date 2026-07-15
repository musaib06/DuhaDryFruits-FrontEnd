import { NgModel } from "@angular/forms";
import { BaseViewModel } from "../../internal/base.viewmodel";
import { InputControlInformation } from "../../internal/common-models";
import { TokenRequestSM } from "../../service-models/app/token/token-request-s-m";
import { LoginUserSM } from "../../service-models/app/v1/app-users/login/login-user-s-m";
import { RoleTypeSM } from "../../service-models/app/enums/role-type-s-m.enum";

export class SuperadminLoginViewmodel extends BaseViewModel {
    override PageTitle: string = 'Admin-Login-In';
    tokenRequest: TokenRequestSM = new TokenRequestSM();
    loginUser!: LoginUserSM;
    rolesList!: { key: RoleTypeSM; value: string }[];
    override controlsInformation: { [key: string]: InputControlInformation } = {
        loginId: {
            hasError: false,
            isRequired: true,
            maxlength: 16,
            minlength: 3,
            // pattern: '[a-zA-Z][a-zA-Z ]+',   
            controlName: 'loginId',
            placeHolder: 'UserName',
            errorMessage: '',
            validations: [
                { type: "required", message: "UserId is Required" },
                { type: 'pattern', message: 'Cannot contain digits' },
                { type: "minlength", message: "UserName must be more than 3 characters." },
                { type: "maxlength", message: "UserName must be less than 16 characters." },
            ]
        },
        password: {
            controlName: 'password',
            hasError: false,
            isRequired: true,
            maxlength: 16,
            minlength: 3,
            // pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[@#$%^&+=!]).{8,}$",
            placeHolder: 'Password',
            errorMessage: '',
            validations: [
                { type: "required", message: "Password is Required" },
                { type: 'pattern', message: "Must have one: uppercase, lowercase, digit, symbol." },
                { type: "minlength", message: "Password must be more than 3 characters." },
                { type: "maxlength", message: "Password must be less than 16 characters." },
            ]
        },
        roleType: {
            controlName: 'roleType',
            hasError: false,
            isRequired: true,
            placeHolder: 'Role Type',
            errorMessage: '',
            validations: [
                { type: "required", message: "Please Select Role." },
            ]
        },
        // Add more ControlInfo objects with keys as needed
    };

}