import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status === 401) {
                return throwError(() => err);
            }
            const apiMsg =
                err?.error?.message ?? err?.error?.msg ?? err?.message ?? 'Error de red';
            console.error('API error:', apiMsg, err);
            return throwError(() => err);
        })
    );
};

