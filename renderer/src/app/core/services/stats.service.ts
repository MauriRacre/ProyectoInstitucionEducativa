import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { enviroment } from "../../../environment/enviroment";
import { Observable } from "rxjs";
export interface StatsResponse {
    totalIngresos: number;
    ingresosMes: number;
    descuentos: number;
    reversiones: number;
}

@Injectable({
    providedIn: 'root',
})

export class StatsService{
    private readonly baseUrl = `${enviroment.apiUrl}/api/dashboard`;
    constructor(private http: HttpClient) {}
    
    list(): Observable<StatsResponse> {
        return this.http.get<StatsResponse>(`${this.baseUrl}/stats`);
    }

}