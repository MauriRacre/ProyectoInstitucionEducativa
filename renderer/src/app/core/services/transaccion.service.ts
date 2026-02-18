import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { enviroment } from "../../../environment/enviroment";
import { Observable } from "rxjs";

export type TransactionType = 'PAYMENT' | 'DISCOUNT' | 'REVERSAL';
export interface CreateExpenseDTO {
    encargado: string;
    concepto: string;
    monto: number;
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
    type: TransactionType;
    amount: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
}

export interface TransactionSearchParams {
    responsible?: string;
    tutor?: string;
    type?: 'ALL' | TransactionType;
    concept?: string;
    from?: string; 
    to?: string;   
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
    getTransactions(page = 1, pageSize = 10): Observable<PaginatedResponse<TransactionItem>> {
        const params = new HttpParams()
        .set('page', page)
        .set('pageSize', pageSize);

        return this.http.get<PaginatedResponse<TransactionItem>>(
        `${this.baseUrl}${this.resource}`,
        { params }
        );
    }

    /**
     * GET /search
     * Historial con filtros
     */
    searchTransactions(filters: TransactionSearchParams): Observable<PaginatedResponse<TransactionItem>> {

        let params = new HttpParams();

        Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params = params.set(key, String(value));
        }
        });

        return this.http.get<PaginatedResponse<TransactionItem>>(
        `${this.baseUrl}${this.resource}/search`,
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
            `${this.baseUrl}/api/gasto`,
            dto
        );
    }
}
