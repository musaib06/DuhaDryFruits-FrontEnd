import { BaseViewModel } from "../../internal/base.viewmodel";
import { InputControlInformation } from "../../internal/common-models";
import { PaginationViewModel } from "../../internal/pagination.viewmodel";
import { SignUpSM } from "../../service-models/app/v1/app-users/login/sign-up-s-m";

export class RegisterViewModel implements BaseViewModel{
  pagination!: PaginationViewModel;
  FormSubmitted: boolean = false;
  controlsInformation?: { [key: string]: InputControlInformation; };
    PageTitle!: string;
     signUpSM:SignUpSM= new SignUpSM();
     confirmPassword!:string;
     formSubmitted: boolean = false;
     hide: boolean = true;
     eyeDefault = 'default';
     showTooltip: boolean = false;
     validations = {
        firstName: [
            { type: "required", message: "firstName  is Required !" },
            { type: 'minlength', value: 2, message: 'Minimum Length is 2 Characters !' },
            { type: 'maxlength', value: 50, message: 'Maximum Length is 50 Characters !' },
            { type: "pattern", message: "Not Valid Format !" },
          ],
        lastName: [
          { type: "required", message: "lastName  is Required !" },
          { type: 'minlength', value: 2, message: 'Minimum Length is 2 Characters !' },
          { type: 'maxlength', value: 50, message: 'Maximum Length is 50 Characters !' },
          { type: "pattern", message: "Not Valid Format !" },
        ],
        personalEmail: [
            { type: "required", message: "Personal Email ID is Required !" },
            { type: "minlength", value: 6, message: "Minimum Length is 6 Characters !" },
            { type: "maxlength", value: 50, message: "Maximum Length is 50 Characters !" },
            { type: "pattern", message: "Format Not Valid!" },
          ],
          password: [
            { type: "required", message: "Password  is Required !" },
            { type: 'minlength', value: 6, message: 'Minimum Length is 6 Characters !' },
            { type: 'maxlength', value: 10, message: 'Maximum Length is 10 Characters !' },
            { type: "pattern", message: "Not Valid Format !" },
          ],
          confirmPassword: [
          { type: "required", message: "Confirm Password  is Required !" },
          { type: 'minlength', value: 6, message: 'Minimum Length is 6 Characters !' },
          { type: 'maxlength', value: 10, message: 'Maximum Length is 10 Characters !' },
          { type: "pattern", message: "Not Valid Format !" },
        ]
      };
}