import { LogLocation } from './log-location';

export class LoggerConfig {
    constructor() {
        this.logLocations = new Array<LogLocation>();
        this.exceptionLogLocations = new Array<LogLocation>();
    }
    logLocations: Array<LogLocation>;
    exceptionLogLocations: Array<LogLocation>;
}