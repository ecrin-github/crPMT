import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class StudyCountryService {

  constructor(private http: HttpClient) { }

  getStudyCountries(sid) {
    return this.http.get(`${base}/core/studies/${sid}/study-countries`);
  }

  /* CRUD */
  addStudyCountry(sid, payload) {
    return this.http.post(`${base}/core/studies/${sid}/study-countries`, payload);
  }
  getStudyCountry(id) {
    return this.http.get(`${base}/core/study-countries/${id}`);
  }
  editStudyCountry(id, payload) {
    return this.http.put(`${base}/core/study-countries/${id}`, payload);
  }
  deleteStudyCountry(id) {
    return this.http.delete(`${base}/core/study-countries/${id}`, {observe: "response", responseType: 'json'});
  }

  /* Bulk queries: one query for a whole list of items (#125) */
  addStudyCountries(payload) {
    return this.http.post(`${base}/core/study-countries/bulk_create`, payload, { observe: 'response' });
  }
  editStudyCountries(payload) {
    return this.http.put(`${base}/core/study-countries/bulk_update`, payload, { observe: 'response' });
  }
  deleteStudyCountries(ids) {
    return this.http.post(`${base}/core/study-countries/bulk_delete`, { ids: ids }, { observe: 'response' });
  }
}
