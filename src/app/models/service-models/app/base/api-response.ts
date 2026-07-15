import { ErrorData } from "./error-data";

export class ApiResponse<T> {
    responseStatusCode: number;  // Required property
    successData?: T;             // Optional generic property
    isError: boolean;            // Required property
    errorData: ErrorData;        // Required property

    constructor(
        responseStatusCode: number,
        successData: T | undefined,
        isError: boolean,
        errorData: ErrorData
    ) {
        this.responseStatusCode = responseStatusCode;
        this.successData = successData;
        this.isError = isError;
        this.errorData = errorData;
    }
}