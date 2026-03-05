import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { enviroment } from '../../../environment/enviroment';
@Injectable({
    providedIn: 'root'
})
export class EstadisticasService {

    private readonly baseUrl = `${enviroment.apiUrl}/api`;
    constructor(private http: HttpClient) {}
    
    getTotalEstudiantes(): Observable<any> {
        return this.http.get(`${this.baseUrl}/estudiantes/total`);
    }

    getTotalTutores(): Observable<any> {
        return this.http.get(`${this.baseUrl}/tutores/total`);
    }

    getIngresosPorMes(year: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/transactions/ingresos-mes?year=${year}`);
    }

    getMorosidad(month: number, year: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/mensualidades/morosidad?month=${month}&year=${year}`);
    }

    getInscritosCursos(month: number, year: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/servicios/total-inscritos?month=${month}&year=${year}`);
    }

    getIngresosCursos(month: number, year: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/servicios/ingresos-curso?month=${month}&year=${year}`);
    }

    getRankingEstudiantes(month: number, year: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/estudiantes/ranking-estudiantes?month=${month}&year=${year}`);
    }

    getDescuentosAnual(year: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/reportes/descuentos-anual?year=${year}`);
    }
}