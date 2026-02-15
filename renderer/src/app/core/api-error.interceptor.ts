import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((err: HttpErrorResponse) => {
        const apiMsg =
            err?.error?.message ?? err?.error?.msg ?? err?.message ?? 'Error de red';
        console.error('API error:', apiMsg, err);
        return throwError(() => err);
        })
    );
};

