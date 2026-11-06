import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class StudyAgreementAmendmentService {

  constructor(private http: HttpClient) { }

  /* Lists */
  getStudyAgreementAmendments(saId) {
    return this.http.get(`${base}/core/study-agreements/${saId}/study-agreement-amendments`);
  }

  /* CRUD */
  addAmendmentFromStudyAgreement(saId, payload) {
    return this.http.post(`${base}/core/study-agreements/${saId}/study-agreement-amendments`, payload);
  }

  getStudyAgreementAmendment(id) {
    return this.http.get(`${base}/core/study-agreement-amendments/${id}`);
  }
  editStudyAgreementAmendment(id, payload) {
    return this.http.put(`${base}/core/study-agreement-amendments/${id}`, payload);
  }
  deleteStudyAgreementAmendment(id) {
    return this.http.delete(`${base}/core/study-agreement-amendments/${id}`, {observe: "response", responseType: 'json'});
  }

  /* Bulk queries (#18) */
  addStudyAgreementAmendments(payload) {
    return this.http.post(`${base}/core/study-agreement-amendments/bulk_create`, payload, { observe: 'response' });
  }

  editStudyAgreementAmendments(payload) {
    return this.http.put(`${base}/core/study-agreement-amendments/bulk_update`, payload, { observe: 'response' });
  }

  deleteStudyAgreementAmendments(ids) {
    return this.http.post(`${base}/core/study-agreement-amendments/bulk_delete`, { ids: ids }, { observe: 'response' });
  }
}
