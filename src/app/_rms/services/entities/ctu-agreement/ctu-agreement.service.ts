import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class CtuAgreementService {

  constructor(private http: HttpClient) { }

  /* Lists */
  getStudyCTUAgreements(sctuId) {
    return this.http.get(`${base}/core/study-ctus/${sctuId}/ctu-agreements`);
  }
  
  /* CRUD */
  addCTUAgreementFromStudyCTU(sctuId, payload) {
    return this.http.post(`${base}/core/study-ctus/${sctuId}/ctu-agreements`, payload);
  }

  getCTUAgreement(id) {
    return this.http.get(`${base}/core/ctu-agreements/${id}`);
  }
  editCTUAgreement(id, payload) {
    return this.http.put(`${base}/core/ctu-agreements/${id}`, payload);
  }
  deleteCTUAgreement(id) {
    return this.http.delete(`${base}/core/ctu-agreements/${id}`, {observe: "response", responseType: 'json'});
  }

  /* Bulk queries: one query for a whole list of items (#125) */
  addCTUAgreements(payload) {
    return this.http.post(`${base}/core/ctu-agreements/bulk_create`, payload, { observe: 'response' });
  }
  editCTUAgreements(payload) {
    return this.http.put(`${base}/core/ctu-agreements/bulk_update`, payload, { observe: 'response' });
  }
  deleteCTUAgreements(ids) {
    return this.http.post(`${base}/core/ctu-agreements/bulk_delete`, { ids: ids }, { observe: 'response' });
  }
}
