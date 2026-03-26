import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PublicationInterface {
  id?: number;
  title: string;
  pubmedUrl: string;
  project?: number;
  study?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PublicationService {
  private apiUrl = `${environment.baseUrlApi}/core/publications`;

  constructor(private http: HttpClient) {}

  getPublicationList(): Observable<PublicationInterface[]> {
    return this.http.get<PublicationInterface[]>(this.apiUrl);
  }

    getPublicationsByProject(projectId: string | number): Observable<PublicationInterface[]> {
        const url = `${this.apiUrl}?project=${projectId}`;
        console.log('GET publications URL =', url);
        return this.http.get<PublicationInterface[]>(url);
    }   

  addPublication(payload: PublicationInterface): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  editPublication(id: number, payload: PublicationInterface): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  deletePublication(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}