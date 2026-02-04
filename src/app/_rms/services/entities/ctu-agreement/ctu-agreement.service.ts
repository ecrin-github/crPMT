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
}
