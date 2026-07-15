/**
 * Enhanced Error Logger Service
 * Logs errors to backend API for centralized error tracking
 */

import { Injectable, ErrorHandler, Injector, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ErrorLoggerService {
  private errorQueue: any[] = [];
  private isProcessingQueue = false;
  private maxQueueSize = 50;
  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Process queue on initialization
    this.processQueue();
  }

  /**
   * Log error to backend
   */
  async logError(error: any, context?: {
    component?: string;
    level?: 'error' | 'warning' | 'critical' | 'info';
    additionalData?: any;
  }): Promise<void> {
    try {
      const errorData = {
        error: error?.message || String(error),
        errorMessage: error?.message || String(error),
        stackTrace: error?.stack || null,
        level: context?.level || 'error',
        url: this.isBrowser ? window.location.href : this.router.url,
        component: context?.component || this.getCurrentComponent(),
        userAgent: this.isBrowser ? navigator.userAgent : 'Angular SSR',
        timestamp: new Date().toISOString(),
        statusCode: error?.status || error?.statusCode || null,
        additionalData: {
          ...context?.additionalData,
          errorName: error?.name,
          errorType: error?.constructor?.name,
        },
      };

      // Add to queue for batch processing
      this.errorQueue.push(errorData);

      // Limit queue size
      if (this.errorQueue.length > this.maxQueueSize) {
        this.errorQueue.shift(); // Remove oldest
      }

      // Process queue asynchronously
      this.processQueue();
    } catch (logError) {
      // Fallback to console if logging fails
      console.error('Failed to queue error for logging:', logError);
      console.error('Original error:', error);
    }
  }

  /**
   * Process error queue (batch send to backend)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process errors in batches
      const batch = this.errorQueue.splice(0, 10); // Process 10 at a time

      for (const errorData of batch) {
        try {
          // Send to backend (non-blocking, fire and forget)
          this.http.post(`${environment.apiBaseUrl}/api/v1/error-log`, errorData, {
            headers: { 'Content-Type': 'application/json' }
          }).subscribe({
            next: () => {
              // Successfully logged
            },
            error: (err) => {
              // If logging fails, at least log to console
              console.error('Failed to send error to backend:', err);
            }
          });
        } catch (err) {
          console.error('Error sending error log:', err);
        }
      }
    } catch (error) {
      console.error('Error processing error queue:', error);
    } finally {
      this.isProcessingQueue = false;

      // Process remaining items after a delay
      if (this.errorQueue.length > 0) {
        setTimeout(() => this.processQueue(), 5000);
      }
    }
  }

  /**
   * Get current component name from router
   */
  private getCurrentComponent(): string {
    try {
      const url = this.router.url;
      return url.split('?')[0]; // Remove query params
    } catch {
      return 'unknown';
    }
  }

  /**
   * Log API error
   */
  async logApiError(error: any, endpoint: string, method: string, requestData?: any): Promise<void> {
    await this.logError(error, {
      component: `API: ${method} ${endpoint}`,
      level: error?.status >= 500 ? 'critical' : 'error',
      additionalData: {
        endpoint,
        method,
        requestData: this.sanitizeData(requestData),
      },
    });
  }

  /**
   * Sanitize sensitive data
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'creditCard', 'cvv'];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }
}

/**
 * Global Error Handler
 * Catches all unhandled errors
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    const errorLogger = this.injector.get(ErrorLoggerService);
    
    // Log to backend
    errorLogger.logError(error, {
      component: 'GlobalErrorHandler',
      level: 'error',
    }).catch(err => {
      console.error('Failed to log error:', err);
    });

    // Also log to console for development
    console.error('Global error handler:', error);
  }
}

