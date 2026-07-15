import { ErrorHandler, Injectable } from '@angular/core';
import { CommonLogger } from '../clients/helpers/common-logger.helper';

@Injectable({
  providedIn: 'root'
})
export class LogHandlerService implements ErrorHandler {

  constructor() {


  }

  async logObject(logObject: any) {
    await CommonLogger.LogTextOrObject(logObject);
  }

  async handleError(error: any) {
    await CommonLogger.LogException(error);
    //show error messages from app constants

  }
}
