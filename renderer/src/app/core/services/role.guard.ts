import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {

    return () => {
        const auth = inject(AuthService);
        const router = inject(Router);

        const user = auth.getUser();

        if (!user || !allowedRoles.includes(user.rol)) {
        router.navigate(['/']);
        return false;
        }

        return true;
    };
};
