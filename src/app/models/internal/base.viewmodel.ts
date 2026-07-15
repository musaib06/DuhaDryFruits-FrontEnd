import { InputControlInformation } from "./common-models";
import { PaginationViewModel } from "./pagination.viewmodel";

export class BaseViewModel {
    PageTitle: string = '';
    pagination: PaginationViewModel = { PageNo: 1, PageSize: 8, totalCount: 0, totalPages: [] }
    FormSubmitted: boolean=false;
    controlsInformation?: { [key: string]: InputControlInformation }

}



