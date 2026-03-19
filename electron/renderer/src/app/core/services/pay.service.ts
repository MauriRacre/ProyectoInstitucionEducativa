import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
    tipo?: "MENSUALIDAD" | "SERVICIO" | "GASTO_OCASIONAL";
    nombre_servicio?: string | null;
}

export interface MovementDTO {
    paid: number;
    discount: number;
    note?: string | null;
    responsible?: string | null;
    dateISO?: string;
    metodo_pago: string;
}

export interface CreateGastoOcasionalDto {
    estudiante_id?: number | null;
    concepto: string;
    descripcion?: string | null;
    fecha: string; 
    base_amount: number;
    extra_amount?: number;
    discount_amount?: number;
    encargado?: string | null;
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
    // Crear gasto
    // ===============================
    createGasto(data: CreateGastoOcasionalDto): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/api/gastos`, data);
    }
    // ===============================
    // Registrar movimiento
    // ===============================
    registerMovement(
        conceptId: number,
        tipo: string,
        dto: MovementDTO
    ): Observable<{
        movementId: number;
        conceptId: number;
        newPending: number;
    }> {
        return this.http.post<any>(
        `${this.baseUrl}/api/payment-concepts/${tipo}/${conceptId}/movements`,
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
            this.registerMovement(m.conceptId, m.tipo, m.dto)
            ),
            toArray()
        );
        }
    
    //================================
    // Factura deuda
    //================================
    getDeuda(id: number): Observable<any>{
        return this.http.get<any>(
        `${this.baseUrl}/api/estudiantes/${id}/deuda`
        );
    }

    //================================
    // Factura pagos - mensualidad
    //================================
    getPagosMensualidad(id: number, year: number): Observable<any>{
        const hp = new HttpParams()
                .set('year', String(year));
        return this.http.get<any>(
        `${this.baseUrl}/api/reportes/pagos-mensualidades/${id}`, 
            { params: hp }
        );
    }

    //================================
    // Factura pagos - servicios extras
    //================================
    getPagosServicios(id: number, year: number): Observable<any>{
        const hp = new HttpParams()
                .set('year', String(year));
        return this.http.get<any>(
        `${this.baseUrl}/api/reportes/pagos-extra/${id}`, 
            { params: hp }
        );
    }
}