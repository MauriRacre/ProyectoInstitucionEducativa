import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { enviroment } from '../../../environment/enviroment';
// models/student.model.ts

export interface Student {
    id: number;
    tutorId: number;
    name: string;
    grade: string;
    parallel: string;
}
export interface StudentRow {
    id: number;
    name: string;
    tutorName: string;
    tutorPhone: string;
    tutorEmail: string;
    grade: string;
    parallel: string;
}

export interface PaymentHistory {
    id: number;
    dateISO: string;
    type: 'PAYMENT';
    conceptLabel: string;
    paid: number;
    discount: number;
    appliedTotal: number;
    note: string;
    staff: string;
    movementId: number;
    reversed: boolean;
}

export interface PaymentConcept {
    id: number;
    studentId: number;
    categoryId: string; // "MONTHLY"
    concept: string;
    period: {
        year: number;
        month: number;
    };
    amountTotal: number;
    pending: number;
    history: PaymentHistory[];
}

export interface PaymentConceptResponse {
    items: PaymentConcept[];
}

@Injectable({
    providedIn: 'root'
})
export class StudentService {

    private readonly baseUrl = `${enviroment.apiUrl}/api/estudiantes`;

    constructor(private http: HttpClient) {}

    // ===============================
    // GET /estudiantes
    // ===============================
    getAll(): Observable<Student[]> {
        return this.http.get<Student[]>(this.baseUrl);
    }

    // ===============================
    // GET /estudiantes/tutor/:tutorId
    // ===============================
    getByTutor(tutorId: number): Observable<Student[]> {
        return this.http.get<Student[]>(
        `${this.baseUrl}/tutor/${tutorId}`
        );
    }

    // ===============================
    // GET /estudiantes/:studentId/payment-concepts
    // ===============================
    getPaymentConcepts(
        studentId: number,
        year: number,
        includeHistory: boolean = false
    ): Observable<PaymentConceptResponse> {

        let params = new HttpParams()
        .set('year', year.toString())
        .set('includeHistory', includeHistory.toString());

        return this.http.get<PaymentConceptResponse>(
        `${this.baseUrl}/${studentId}/payment-concepts`,
        { params }
        );
    }

    // ===============================
    // POST /estudiantes
    // ===============================
    create(student: {
        nombre: string;
        grado: string;
        paralelo: string;
        tutor_id: number;
    }): Observable<{ ok: boolean; id: number }> {

        return this.http.post<{ ok: boolean; id: number }>(
        this.baseUrl,
        student
        );
    }
    // ===============================
    // GET /Nomina de cursos
    // ===============================
    getNominaCourses(): Observable<any[]>{
        return this.http.get<any[]>(`${this.baseUrl}/nomina/courses`);
    }
    getNominaStudents(params:{
        grade:string;
        parallel: string;
        q?: string;
        page: number;
        pageSize: number;
    }): Observable<{items: StudentRow[]; total: number}>{
        return this.http.get<{items: StudentRow[]; total: number}>(
            `${this.baseUrl}/nomina`,
            {params}
        );
    }
}
