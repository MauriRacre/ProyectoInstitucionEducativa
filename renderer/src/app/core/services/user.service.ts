import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { enviroment } from "../../../environment/enviroment";
import { Observable } from "rxjs";
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  ping: number;
}

@Injectable({
    providedIn: 'root',
})

export class UserService{
    private readonly baseUrl = `${enviroment.apiUrl}/api/users`;
    constructor(private http: HttpClient) {}
    // ========================================
    // GET ALL
    // ========================================
    list(): Observable<{ items: User[] }> {
        return this.http.get<{ items: User[] }>(this.baseUrl);
    }
    // ========================================
    // GET BY ID
    // ========================================
    get(id: number): Observable<any>{
        return this.http.get<any>(`${this.baseUrl}/${id}`);
    }
    // ========================================
    // CREATE
    // ========================================
    create(payload: {
        nombre: string;
        username: string;
        password: string;
        rol: string;
        email: string
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
        nombre: string;
        username: string;
        rol: string;
        email: string
    }): Observable<any> {
        return this.http.put<any>(
        `${this.baseUrl}/${id}`,
        payload
        );
    }
}