import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { enviroment } from '../../../environment/enviroment';

export interface PayHistory {
  id: number;
  dateISO: string;
  type: string;
  conceptLabel: string;
  paid: number;
  discount: number;
  appliedTotal: number;
  note: string;
  staff: string;
  movementId: number;
  reversed: boolean;
}

export interface ConceptItem {
  id: number;
  studentId: number;
  categoryId: string;
  concept: string;
  period: { year: number; month: number };
  amountTotal: number;
  pending: number;
  history: PayHistory[];
}

export interface Child {
  id: number;
  name: string;
  grade: string;
  parallel: string;
}

export interface TutorViewResponse {
  tutor: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  children: Child[];
  paymentsByChild: {
    [studentId: number]: ConceptItem[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {

    private baseUrl = `${enviroment.apiUrl}/api`;

    constructor(private http: HttpClient) {}

    getByStudentId(studentId: number) {
      return this.http.get<any>(
        `${this.baseUrl}/estudiantes/servicios/${studentId}`
      );
    }
    /* ===============================
        INSCRIBIR
    =============================== */

    enroll(payload: {
        estudiante_id: number;
        servicio_id: number;
        period: { year: number; month?: number };
        base_amount: number;
        extra_amount?: number;
        discount_amount?: number;
    }) {
        return this.http.post(
        `${this.baseUrl}/servicios/`,
        payload
        );
    }

    /* ===============================
        DESINSCRIBIR
    =============================== */

    unsubscribe(registroId: number) {
        return this.http.patch(
        `${this.baseUrl}/servicios/${registroId}/desuscribir`,
        {}
        );
    }
}