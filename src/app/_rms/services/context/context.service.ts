import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  constructor( private http: HttpClient) { }

  getCountries() {
    return this.http.get(`${environment.baseUrlApi}/context/countries`);
  }

  getCTUs() {
    return this.http.get(`${environment.baseUrlApi}/context/ctus`);
  }
  
  getStudyStatuses() {
    return this.http.get(`${environment.baseUrlApi}/context/study-statuses`);
  }
}
