import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { enviroment } from '../../../environment/enviroment';
export type TutorStatusFilter = 'ALL' | 'DEBT' | 'OK';

export interface TutorListItem {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  students: string[];
  balance: number;
}

export interface TutorListResponse {
  items: TutorListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface StudentItem {
  id: number;
  tutorId: number;
  name: string;
  grade: string;
  parallel: string;
}

export interface TutorDetailResponse {
  parent: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    balance: number;
  };
  students: StudentItem[];
}

export interface TutorStudentsResponse {
  items: StudentItem[];
}

export interface CreateTutorPayload {
  parent: {
    name: string;
    email?: string | null;
    phone: string;
  };

  period: {
    year: number;
    month: number;
  };

  students: Array<{
    name: string;
    grade: string;
    parallel: string;
    monto: number;
  }>;
}

export interface UpdateTutorPayload {
  parent: {
    name: string;
    email?: string | null;
    phone: string;
  };

  students: Array<{
    id?: number;
    name: string;
    grade: string;
    parallel: string;
    monto: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class TutorApiService {
    private readonly baseUrl = enviroment.apiUrl;
    private readonly resource = '/api/tutores';

    constructor(private http: HttpClient) {}

    list(params?: {
      q?: string;
      status?: TutorStatusFilter;
      concepto?: string;
      page?: number;
      pageSize?: number;
    }) {

      let hp = new HttpParams();

      if (params?.q != null) hp = hp.set('q', params.q);
      if (params?.status != null) hp = hp.set('status', params.status);
      if (params?.concepto != null) hp = hp.set('concepto', params.concepto);
      if (params?.page != null) hp = hp.set('page', String(params.page));
      if (params?.pageSize != null) hp = hp.set('pageSize', String(params.pageSize));

      return this.http.get<TutorListResponse>(
        `${this.baseUrl}${this.resource}`,
        { params: hp }
      );
    }
    /**tutor con estudiantes id  */
    getById(tutorId: number) {
        return this.http.get<TutorDetailResponse>(`${this.baseUrl}${this.resource}/${tutorId}`);
    }

    getStudents(tutorId: number) {
        return this.http.get<TutorStudentsResponse>(`${this.baseUrl}${this.resource}/${tutorId}/students`);
    }

    getPayView(tutorId: number, year: number, includeHistory = false) {
        const hp = new HttpParams()
        .set('year', String(year))
        .set('includeHistory', includeHistory ? 'true' : 'false');

        return this.http.get<any>(`${this.baseUrl}${this.resource}/${tutorId}/pay-view`, { params: hp });
    }

    getFull(tutorId: number) {
        return this.http.get<any>(`${this.baseUrl}${this.resource}/${tutorId}/full`);
    }

    create(payload: CreateTutorPayload) {
        return this.http.post<any>(`${this.baseUrl}${this.resource}`, payload);
    }

    update(tutorId: number, payload: UpdateTutorPayload) {
        return this.http.put<{ ok: true }>(`${this.baseUrl}${this.resource}/${tutorId}`, payload);
    }

}
