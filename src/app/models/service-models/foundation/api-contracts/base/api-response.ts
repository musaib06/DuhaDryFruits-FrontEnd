import { ErrorData } from '../error-data';

export class ApiResponse<T> {
    responseStatusCode!: number;
    successData!: T;
    isError!: boolean;
    errorData!: ErrorData;
    axiosResponse: any;
}
