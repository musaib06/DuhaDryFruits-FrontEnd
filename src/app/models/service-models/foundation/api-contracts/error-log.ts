import { LogType } from "../../../internal/log-type";

export class ErrorLog {

    logType!: LogType;
    name: string = '';
    message: string = '';
    stack?: string;
    createdDateUTC: string = new Date().toUTCString();
    platform: string = '';
    username: string = '';
}