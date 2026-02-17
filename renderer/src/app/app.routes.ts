import { Routes } from '@angular/router';
import { Directory } from './feactures/directory/directory';
import { PayPage } from './feactures/pay/pay.page';
import { HistoryPage } from './feactures/history/history.page';
import { SettingsComponent } from './feactures/settings/settings.page';
import { LoginPage } from './feactures/login/login.page';
import { authGuard } from './core/services/auth.guard';
import { roleGuard } from './core/services/role.guard';
import { PrivateLayoutComponent } from './layouts/layout.component';
export const routes: Routes = [
    { path: 'login', component: LoginPage },

    {
        path: '',
        component: PrivateLayoutComponent,
        canActivate: [authGuard],
        children: [
        { path: '', component: Directory },
        { path: 'cobro-tutor/:id', component: PayPage },
        { path: 'history', component: HistoryPage },
        {
            path: 'settings',
            component: SettingsComponent,
            canActivate: [roleGuard(['ADMIN'])]
        }
        ]
    }
];
