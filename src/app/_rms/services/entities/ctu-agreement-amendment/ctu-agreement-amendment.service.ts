import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class CtuAgreementAmendmentService {

  constructor(private http: HttpClient) { }

  /* Lists */
  getCTUAgreementAmendments(ctuAgId) {
    return this.http.get(`${base}/core/ctu-agreements/${ctuAgId}/ctu-agreement-amendments`);
  }
  
  /* CRUD */
  addAmendmentFromCTUAgreement(ctuAgId, payload) {
    return this.http.post(`${base}/core/ctu-agreements/${ctuAgId}/ctu-agreement-amendments`, payload);
  }

  getCTUAgreementAmendment(id) {
    return this.http.get(`${base}/core/ctu-agreement-amendments/${id}`);
  }
  editCTUAgreementAmendment(id, payload) {
    return this.http.put(`${base}/core/ctu-agreement-amendments/${id}`, payload);
  }
  deleteCTUAgreementAmendment(id) {
    return this.http.delete(`${base}/core/ctu-agreement-amendments/${id}`, {observe: "response", responseType: 'json'});
  }
}
