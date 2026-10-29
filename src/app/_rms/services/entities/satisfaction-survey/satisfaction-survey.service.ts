import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class SatisfactionSurveyService {

  constructor(private http: HttpClient) { }

  /* Lists */
  getStudySatisfactionSurveys(studyId) {
    return this.http.get(`${base}/core/studies/${studyId}/satisfaction-surveys`);
  }

  /* CRUD */
  addSatisfactionSurveyFromStudy(studyId, payload) {
    return this.http.post(`${base}/core/studies/${studyId}/satisfaction-surveys`, payload);
  }

  getSatisfactionSurvey(id) {
    return this.http.get(`${base}/core/satisfaction-surveys/${id}`);
  }
  editSatisfactionSurvey(id, payload) {
    return this.http.put(`${base}/core/satisfaction-surveys/${id}`, payload);
  }
  deleteSatisfactionSurvey(id) {
    return this.http.delete(`${base}/core/satisfaction-surveys/${id}`, {observe: "response", responseType: 'json'});
  }
}
