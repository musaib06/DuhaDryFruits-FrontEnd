import { ApiErrorTypeSM } from '../enums/api-error-type-s-m.enum';

export class ApiExceptionRoot {
    exceptionType!: ApiErrorTypeSM;
    displayMessage!: string;
    isToLogInDb!: boolean;
}
