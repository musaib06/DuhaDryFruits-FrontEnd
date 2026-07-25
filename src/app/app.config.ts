import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection, isDevMode,
} from '@angular/core';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { provideRouter, withPreloading, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';
import { CustomPreloadingStrategy } from './strategies/preloading.strategy';
import {
  NgxUiLoaderModule,
  NgxUiLoaderConfig,
  POSITION,
  PB_DIRECTION,
  SPINNER,
} from 'ngx-ui-loader';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideQuillConfig } from 'ngx-quill/config';
import { provideServiceWorker } from '@angular/service-worker';

const quillToolbar = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ header: [2, 3, false] }],
  ['blockquote', 'link'],
  ['clean'],
];

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  // Background spinner (non-blocking small spinner)
  bgsColor: '#c6a15b',
  bgsOpacity: 0.4,
  bgsPosition: POSITION.bottomRight,
  bgsSize: 30,
  bgsType: SPINNER.rectangleBounce,

  // Foreground loader (blocks UI with spinner + progress bar)
  fgsColor: '#435a34',
  fgsPosition: POSITION.centerCenter,
  fgsSize: 70,
  fgsType: SPINNER.threeStrings,

  // Logo removed for the Duha rebrand — clean branded spinner only
  logoUrl: '',
  logoSize: 210,
  logoPosition: POSITION.centerCenter,

  // Progress bar
  pbColor: '#c6a15b',
  pbDirection: PB_DIRECTION.leftToRight,
  pbThickness: 6,
  hasProgressBar: true,

  // Loading message
  text: 'Loading, please wait...',
  textColor: '#435a34',
  textPosition: POSITION.centerCenter,

  // Aesthetic effects
  overlayColor: 'rgba(251, 249, 243, 0.75)',
  overlayBorderRadius: '8px',
  blur: 4,
  fastFadeOut: true,
  delay: 100,
  minTime: 150,
  maxTime: 10000,
  gap: 20, // Increased gap between logo and spinner for better visual separation
};
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Render all `date` pipe output in IST (UTC+5:30) regardless of the
    // viewer's device or the SSR server timezone.
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '+0530' } },
    provideRouter(
      routes,
      withPreloading(CustomPreloadingStrategy),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      })
    ),
    provideServerRendering(withRoutes(serverRoutes)),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([LoadingInterceptor, AuthInterceptor])
    ),
    provideCharts(withDefaultRegisterables()),
    provideQuillConfig({
      modules: { toolbar: quillToolbar },
      placeholder: 'Write your article here…',
    }),
    importProvidersFrom(NgxUiLoaderModule.forRoot(ngxUiLoaderConfig)),
    CustomPreloadingStrategy, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
  ],
};
