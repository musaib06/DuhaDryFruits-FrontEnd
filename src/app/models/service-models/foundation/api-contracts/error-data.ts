import { ApiErrorTypeSM } from '../enums/api-error-type-s-m.enum';

export class ErrorData {
    apiErrorType!: ApiErrorTypeSM;
    displayMessage!: string;
    additionalProps!: Map<string, Object>;
}
