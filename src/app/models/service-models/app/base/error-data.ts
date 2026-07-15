import { ApiErrorTypeSM } from "../../foundation/enums/api-error-type-s-m.enum";

export class ErrorData {
    errorType: ApiErrorTypeSM;             // Enum property
    displayMessage: string;                // String property
    additionalProps?: { [key: string]: any }; // Dictionary property, with string keys and any type values

    constructor(
        errorType: ApiErrorTypeSM,
        displayMessage: string,
        additionalProps?: { [key: string]: any }
    ) {
        this.errorType = errorType;
        this.displayMessage = displayMessage;
        this.additionalProps = additionalProps;
    }
}