import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import {
  connectionErrorInterceptor,
  jwtInterceptor,
  unautorizedInterceptor,
} from './core/interceptors';
import { SalesService } from './core/services/sales-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor, unautorizedInterceptor, connectionErrorInterceptor]),
    ),
    { provide: MAT_DATE_LOCALE, useValue: 'sr-RS' },
    SalesService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
