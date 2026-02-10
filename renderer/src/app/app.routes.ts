import { Routes } from '@angular/router';
import { Directory } from './feactures/directory/directory';
import { PayPage } from './feactures/pay/pay.page';
import { HistoryPage } from './feactures/history/history.page';
export const routes: Routes = [
    { path: '', component: Directory},
    { path: 'cobro-tutor', component: PayPage},
    { path: 'history', component: HistoryPage}
];
