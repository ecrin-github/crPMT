import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class StudyCtuService {

  constructor(private http: HttpClient) { }

  /* Study CTU lists */
  getStudyCTUs(sid) {
    return this.http.get(`${base}/core/studies/${sid}/study-ctus`);
  }
  getStudyCountryStudyCTUs(scid) {
    return this.http.get(`${base}/core/study-countries/${scid}/study-ctus`);
  }
  
  /* CRUD */
  addStudyCTUFromStudy(sid, payload) {
    return this.http.post(`${base}/core/studies/${sid}/study-ctus`, payload);
  }
  addStudyCTUFromStudyCountry(scid, payload) {
    return this.http.post(`${base}/core/study-countries/${scid}/study-ctus`, payload);
  }

  getStudyCTU(id) {
    return this.http.get(`${base}/core/study-ctus/${id}`);
  }
  editStudyCTU(id, payload) {
    return this.http.put(`${base}/core/study-ctus/${id}`, payload);
  }
  deleteStudyCTU(id) {
    return this.http.delete(`${base}/core/study-ctus/${id}`, {observe: "response", responseType: 'json'});
  }

  /* Bulk queries: one query for a whole list of items (#125) */
  addStudyCTUs(payload) {
    return this.http.post(`${base}/core/study-ctus/bulk_create`, payload, { observe: 'response' });
  }
  editStudyCTUs(payload) {
    return this.http.put(`${base}/core/study-ctus/bulk_update`, payload, { observe: 'response' });
  }
  deleteStudyCTUs(ids) {
    return this.http.post(`${base}/core/study-ctus/bulk_delete`, { ids: ids }, { observe: 'response' });
  }
}
