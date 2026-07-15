import { BaseViewModel } from "../../internal/base.viewmodel";
import { InputControlInformation } from "../../internal/common-models";
import { DummyTeacherSM } from "../../service-models/app/v1/dummy-teacher-s-m";

export class DummyTeacherViewModel extends BaseViewModel {
    override PageTitle: string = 'Dummy Teacher';
    AddEditModalTitle: string = '';
    teachers: DummyTeacherSM[] = [];
    singleTeacher!: DummyTeacherSM;
    firstName!: string;
    lastName!: string;
    emailAddress!: string;
    override controlsInformation: { [key: string]: InputControlInformation } = {
        firstName: {
            hasError: false,
            isRequired: true,
            maxlength: 15,
            minlength: 3,
            pattern: '[a-zA-Z][a-zA-Z ]+',   
            controlName: 'firstName',
            placeHolder: 'First Name',
            errorMessage: '',
            validations: [
                { type: "required", message: "First Name is Required" },
                { type: 'pattern', message: 'Cannot contain digits' },
                { type: "minlength", message: "First Name must be more than 2 characters." },
                { type: "maxlength", message: "First Name Code must be less than 6 characters." },
            ]
        },
        lastName: {
            hasError: false,
            isRequired: true,
            maxlength: 15,
            minlength: 3,
            pattern: '[a-zA-Z][a-zA-Z ]+',   
            controlName: 'lastName',
            placeHolder: 'Last Name',
            errorMessage: '',
            validations: [
                { type: "required", message: "Last Name is Required" },
                { type: 'pattern', message: 'Cannot contain digits' },
                { type: "minlength", message: "Last Name must be more than 2 characters." },
                { type: "maxlength", message: "Last Name Code must be less than 6 characters." },
            ]
        },
        emailAddress: {
            controlName: 'emailAddress',
            hasError: false,
            isRequired: true,
            maxlength: 25,
            minlength: 5,
            pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}',
            placeHolder: 'Email',
            errorMessage: '',
            validations: [
                { type: "required", message: "Email is Required" },
                { type: 'pattern', message: "Email not valid." },
                { type: "minlength", message: "Email must be more than 5 characters." },
                { type: "maxlength", message: "Email must be less than 25 characters." },
            ]
        },    
        // Add more ControlInfo objects with keys as needed
    };

}