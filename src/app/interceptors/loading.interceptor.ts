/**
 * Loading Interceptor
 * Shows loading indicator for API calls
 */

import { HttpInterceptorFn, HttpRequest, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';
import { InitialLoadService } from '../services/initial-load.service';

// Context token to skip loading for specific requests
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

export const LoadingInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
  const loadingService = inject(LoadingService);
  const initialLoad = inject(InitialLoadService);
  
  // Skip loading if context flag is set
  if (req.context.get(SKIP_LOADING) || initialLoad.isHydrating()) {
    return next(req);
  }

  // Show loading immediately
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Hide loading when request completes (success or error)
      loadingService.hide();
    })
  );
};
