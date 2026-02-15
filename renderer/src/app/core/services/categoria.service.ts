import { Inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { enviroment } from "../../../environment/enviroment";
import { map } from "rxjs/operators";

export type CategoryType = 'MONTHLY' | 'SERVICE' | 'FEE' | 'FINE' | 'OTHER';
export interface CategoryDTO {
    id: number | string;
    name: string;        
    type: CategoryType;
    active: boolean;
}
interface CategoryResponse{
    categories: CategoryDTO[];
}
@Injectable({
    providedIn: 'root'
})
export class CategoryService{
    private readonly baseUrl1 = `${enviroment.apiUrl}/api/catalogs/categories`;
    private readonly baseUrl2 = `${enviroment.apiUrl}/api/categories`;

    constructor(private http: HttpClient){}

    /** GET categorias */
    getAll(): Observable<CategoryDTO[]> {
        return this.http
            .get<CategoryResponse>(this.baseUrl1)
            .pipe(map(res => res.categories));
    }
    /** GET categorias */
    getAllTwo():Observable<CategoryDTO[]>{
        return this.http.get<CategoryDTO[]>(this.baseUrl2);
    }
    
}