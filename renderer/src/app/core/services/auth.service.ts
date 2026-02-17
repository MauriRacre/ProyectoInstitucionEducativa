import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { enviroment } from '../../../environment/enviroment';

export interface LoginRequest {
    username: string;
    ping: string;
}

export interface LoginResponse {
    id: number;
    nombre: string;
    username: string;
    rol: string;
}
@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly baseUrl = `${enviroment.apiUrl}/api/auth`;

    constructor(private http: HttpClient) {}

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(
        `${this.baseUrl}/login`,
        payload
        ).pipe(
        tap(user => {
            localStorage.setItem('user', JSON.stringify(user));
        }),
        catchError(this.handleError)
        );
    }



    logout(): void {
        localStorage.removeItem('user');
    }

    getUser(): LoginResponse | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    private handleError(error: HttpErrorResponse) {
        let message = 'Error inesperado';
        if (error.status === 401) {
        message = 'Credenciales inválidas';
        }
        return throwError(() => new Error(message));
    }
}