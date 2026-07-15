import { PaginationViewModel } from './models/internal/pagination.viewmodel';
import { CommonService } from './services/common.service';
import { LogHandlerService } from './services/log-handler.service';

export class BaseComponent<T> {
  protected _commonService: CommonService;
  protected _exceptionHandler: LogHandlerService;
  viewModel!: T;
  constructor(
    commonService: CommonService,
    exceptionHandler: LogHandlerService
  ) {
    this._commonService = commonService;
    this._exceptionHandler = exceptionHandler;
  }

  async loadPageData() {}

  async getFormattedDate(date: any, convertTime: boolean): Promise<any> {
    if (!this.isValidDate(new Date(date))) return '';
    let dateString = date.toString();
    if (!convertTime) {
      dateString = dateString.split('T')[0];
      return dateString;
    } else {
      let apiUTCTime = new Date(dateString);
      let utcDate = Date.UTC(
        apiUTCTime.getFullYear(),
        apiUTCTime.getMonth(),
        apiUTCTime.getDate(),
        apiUTCTime.getHours(),
        apiUTCTime.getMinutes(),
        apiUTCTime.getSeconds(),
        apiUTCTime.getMilliseconds()
      );
      let localDateTime = new Date(utcDate);
      let months =
        localDateTime.getMonth() < 9
          ? `0${localDateTime.getMonth() + 1}`
          : localDateTime.getMonth() + 1;
      let fullDate =
        localDateTime.getDate() <= 9
          ? `0${localDateTime.getDate()}`
          : localDateTime.getDate();
      let hours =
        localDateTime.getHours() <= 9
          ? `0${localDateTime.getHours()}`
          : localDateTime.getHours();
      let minutes =
        localDateTime.getMinutes() <= 9
          ? `0${localDateTime.getMinutes()}`
          : localDateTime.getMinutes();
      let seconds =
        localDateTime.getSeconds() <= 9
          ? `0${localDateTime.getSeconds()}`
          : localDateTime.getSeconds();
      dateString = `${localDateTime.getFullYear()}-${months}-${fullDate}T${hours}:${minutes}:${seconds}`;
      return dateString;
    }
  }

  disableDates(): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Set the maximum date to 18 years from now (age limit 18 to 40)
    const maxDate = new Date(currentDate);
    maxDate.setFullYear(currentYear - 18);

    // Set the minimum date to 40 years from now
    const minDate = new Date(currentDate);
    minDate.setFullYear(currentYear - 40);

    const year = maxDate.getFullYear();
    const month = ('0' + (maxDate.getMonth() + 1)).slice(-2);
    const day = ('0' + maxDate.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }
  disableToMinDates(): string {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Set the minimum date to 40 years from now
    const minDate = new Date(currentDate);
    minDate.setFullYear(currentYear - 60);

    const year = minDate.getFullYear();
    const month = ('0' + (minDate.getMonth() + 1)).slice(-2);
    const day = ('0' + minDate.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }
  // async show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
  //     this.toasts.push({ textOrTpl, ...options });
  // }

  // async presentToast(message: string) {
  //     this.showToast = true;
  //     this.toasts.push({ message });
  // }

  // async remove(toast: any) {
  //     this.toasts = this.toasts.filter((t) => t !== toast);
  // }

  // /**
  //  * Returns the array of page numbers for input
  //  * @param totalRecordCount Total Record Counts
  //  * @param pageSize Table page size
  //  */
  // getPagesCountArray(totalRecordCount: number, pageSize: number): any {
  //     let totalPages = Math.ceil(totalRecordCount / pageSize);
  //     // if (totalRecordCount > 0)
  //     // debugger;
  //     let x = Array.from(new Array(totalPages), (x, i) => i + 1)
  //     return x
  // }

  isValidDate(date: any): boolean {
    let x =
      date &&
      Object.prototype.toString.call(date) === '[object Date]' &&
      !isNaN(date);
    if (x) x = new Date(date).getFullYear() > 1900;
    return x;
  }
  /**
   * Returns the array of page numbers for input
   * @param paginationModel Paginationmodel with pagesize and total count
   */
  getPagesCountArray(paginationModel: PaginationViewModel): number[] {
    let totalPages = Math.ceil(
      paginationModel.totalCount / paginationModel.PageSize
    );
    return Array.from(new Array(totalPages), (x, i) => i + 1);
  }
}
