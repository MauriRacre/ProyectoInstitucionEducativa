import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { enviroment } from '../../../environment/enviroment';


// ==============================
// Interfaces
// ==============================

export interface Evento {
    id: number;
    evento: string;
    concepto: string;
    destino: string;
}

export interface EventoListResponse {
    items: Evento[];
}


@Injectable({
    providedIn: 'root'
})
export class EventoService {

    private baseUrl = `${enviroment.apiUrl}/api/events`;

    constructor(private http: HttpClient) {}

  // ========================================
  // GET ALL (solo activos)
  // ========================================
    list(): Observable<EventoListResponse> {
        return this.http.get<EventoListResponse>(`${this.baseUrl}`);
    }

    // ========================================
    // GET BY ID
    // ========================================
    getById(id: number): Observable<Evento> {
        return this.http.get<Evento>(`${this.baseUrl}/${id}`);
    }

    // ========================================
    // CREATE
    // ========================================
    create(payload: {
        evento: string;
        concepto: string;
        destino: string;
    }): Observable<any> {
        return this.http.post<any>(
        this.baseUrl,
        payload
        );
    }

    // ========================================
    // UPDATE
    // ========================================
    update(id: number, payload: {
        evento: string;
        concepto: string;
        destino: string;
    }): Observable<any> {
        return this.http.put<any>(
        `${this.baseUrl}/${id}`,
        payload
        );
    }

    // ========================================
    // DELETE (soft delete)
    // ========================================
    delete(id: number): Observable<any> {
        return this.http.delete<any>(
        `${this.baseUrl}/${id}`
        );
    }
}
