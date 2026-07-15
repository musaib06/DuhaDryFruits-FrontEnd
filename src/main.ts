import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
// 👇 Import JS libraries before Angular bootstraps
import 'jquery';
import 'bootstrap';
import 'datatables.net';
import 'datatables.net-bs5';
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
