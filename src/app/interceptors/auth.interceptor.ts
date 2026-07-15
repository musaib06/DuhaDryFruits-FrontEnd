import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { AppConstants } from '../../app-constants';

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
  const storageService = inject(StorageService);
  
  // Get token asynchronously from storage service (handles encryption)
  return from(storageService.getDataFromAnyStorage(AppConstants.DbKeys.ACCESS_TOKEN)).pipe(
    switchMap(token => {
      if (token) {
        // Clone request and add auth header
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next(authReq);
      }
      return next(req);
    }),
    catchError(error => {
      console.warn('AuthInterceptor: Error retrieving token', error);
      return next(req);
    })
  );
};
