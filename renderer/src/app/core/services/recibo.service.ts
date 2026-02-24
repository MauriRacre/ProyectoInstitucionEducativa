import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ReciboService {
    getNextReciboNumero(): string {
        const key = 'recibo_correlativo';
        const actual = localStorage.getItem(key);
        const numeroActual = actual ? Number(actual) : 0;
        const siguiente = numeroActual + 1;
        localStorage.setItem(key, String(siguiente));
        return siguiente.toString().padStart(6, '0');
    }
}