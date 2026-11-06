import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class StudyAgreementService {

  constructor(private http: HttpClient) { }

  /* Lists */
  getStudyStudyAgreements(studyId) {
    return this.http.get(`${base}/core/studies/${studyId}/study-agreements`);
  }

  /* CRUD */
  addStudyAgreementFromStudy(studyId, payload) {
    return this.http.post(`${base}/core/studies/${studyId}/study-agreements`, payload);
  }

  getStudyAgreement(id) {
    return this.http.get(`${base}/core/study-agreements/${id}`);
  }
  editStudyAgreement(id, payload) {
    return this.http.put(`${base}/core/study-agreements/${id}`, payload);
  }
  deleteStudyAgreement(id) {
    return this.http.delete(`${base}/core/study-agreements/${id}`, {observe: "response", responseType: 'json'});
  }

  /* Bulk queries: one query for a whole list of items (#125) */
  addStudyAgreements(payload) {
    return this.http.post(`${base}/core/study-agreements/bulk_create`, payload, { observe: 'response' });
  }
  editStudyAgreements(payload) {
    return this.http.put(`${base}/core/study-agreements/bulk_update`, payload, { observe: 'response' });
  }
  deleteStudyAgreements(ids) {
    return this.http.post(`${base}/core/study-agreements/bulk_delete`, { ids: ids }, { observe: 'response' });
  }
}
