import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { enviroment } from "../../../environment/enviroment";
import { Observable } from "rxjs";

export type TransactionType = 'PAYMENT' | 'EXPENSE' | 'REVERSAL';
export interface CreateExpenseDTO {
    encargado: string;
    concepto: string;
    monto: number;
    metodo_pago: string;
}
export interface TransactionItem {
    id: number;
    dateISO: string;   
    time?: string;    
    fecha?: string;     
    responsable?: string;
    staff?: string;
    tutor: string;
    student: string;
    grade?: string;
    parallel?: string;
    concept?: string;
    note?: string | null;
    paymentMethod?: 'QR' | 'EFECTIVO' | null;
    type: TransactionType;
    amount: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    summary: SummaryResponse;
}
export interface SummaryResponse{
    totalPayments: number;
    totalCash: number;
    totalQR: number;
    totalDiscounts: number;
}
export interface TransactionSearchParams {
    q?: string;
    from?: string;
    to?: string;
    paymentMethod?: string;
    page?: number;
    pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {

    private readonly baseUrl = enviroment.apiUrl;
    private readonly resource = '/api/transactions';


    constructor(private http: HttpClient) {}

    /*
     * GET /
     * Historial paginado general
     */
    getTransactions(filters: TransactionSearchParams = {}): Observable<PaginatedResponse<TransactionItem>> {

        let params = new HttpParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
            params = params.set(key, String(value));
            }
        });

        return this.http.get<PaginatedResponse<TransactionItem>>(
            `${this.baseUrl}${this.resource}`,
            { params }
        );
        }
    /** Lista de Conceptos */
    getConcepts(): Observable<string[]>{
        return this.http.get<string[]>(`${this.baseUrl}${this.resource}/concepts`);
    }
    /** Nuevo gasto */
    createGasto(dto: CreateExpenseDTO): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.baseUrl}/api/gasto-salida`,
            dto
        );
    }
}
