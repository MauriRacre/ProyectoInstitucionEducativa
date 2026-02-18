import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, concatMap, forkJoin, from, toArray } from 'rxjs';
import { enviroment } from '../../../environment/enviroment';
export interface CreateMensualidadDTO {
    estudiante_id: number;
    period: {
        year: number;
        month: number;
    };
    base_amount?: number;
    extra_amount?: number;
    discount_amount?: number;
    tipo?: "MENSUALIDAD" | "SERVICIO";
    nombre_servicio?: string | null;
}

export interface MovementDTO {
    paid: number;
    discount: number;
    note?: string | null;
    responsible?: string | null;
    dateISO?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentService {

    private baseUrl = enviroment.apiUrl;

    constructor(private http: HttpClient) {}

  // ===============================
  // Crear mensualidad
  // ===============================
    createMensualidad(dto: CreateMensualidadDTO): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(
            `${this.baseUrl}/api/mensualidades`,
            dto
        );
    }

  // ===============================
  // Registrar movimiento
  // ===============================
    registerMovement(
        conceptId: number,
        dto: MovementDTO
    ): Observable<{
        movementId: number;
        conceptId: number;
        newPending: number;
    }> {
        return this.http.post<any>(
        `${this.baseUrl}/api/payment-concepts/${conceptId}/movements`,
        dto
        );
    }

  // ===============================
  // Revertir movimiento
  // ===============================
    revertMovement(
        movementId: number,
        dto: { reason?: string; responsible?: string }
    ): Observable<{
        ok: boolean;
        reversalMovementId: number;
        newPending: number;
    }> {
        return this.http.post<any>(
        `${this.baseUrl}/api/movements/${movementId}/reversal`,
        dto
        );
    }

    // ===============================
    // Pago múltiple (helper frontend)
    // ===============================
    registerMultipleMovements(movements: any[]) {
        return from(movements).pipe(
            concatMap(m =>
            this.registerMovement(m.conceptId, m.dto)
            ),
            toArray()
        );
        }

}