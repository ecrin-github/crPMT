import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class StudyCountryService {

  constructor(private http: HttpClient) { }

    getStudyCountry(id) {
      return this.http.get(`${base}/core/study-countries/${id}`);
    }
    editStudyCountry(id, payload) {
      return this.http.put(`${base}/core/study-countries/${id}`, payload);
    }
    deleteStudyCountry(id) {
      return this.http.delete(`${base}/core/study-countries/${id}`, {observe: "response", responseType: 'json'});
    }

    addSubmissionFromStudyCountry(scId, payload) {
      return this.http.post(`${base}/core/study-countries/${scId}/submissions`, payload);
    }
    getSubmissionFromStudyCountry(scId, id) {
      return this.http.get(`${base}/core/study-countries/${scId}/submissions/${id}`);
    }
    editSubmissionFromStudyCountry(scId, id, payload) {
      return this.http.put(`${base}/core/study-countries/${scId}/submissions/${id}`, payload);
    }
    deleteSubmissionFromStudyCountry(scId, id) {
      return this.http.delete(`${base}/core/study-countries/${scId}/submissions/${id}`, {observe: "response", responseType: 'json'});
    }

    addNotificationFromStudyCountry(scId, payload) {
      return this.http.post(`${base}/core/study-countries/${scId}/notifications`, payload);
    }
    getNotificationFromStudyCountry(scId, id) {
      return this.http.get(`${base}/core/study-countries/${scId}/notifications/${id}`);
    }
    editNotificationFromStudyCountry(scId, id, payload) {
      return this.http.put(`${base}/core/study-countries/${scId}/notifications/${id}`, payload);
    }
    deleteNotificationFromStudyCountry(scId, id) {
      return this.http.delete(`${base}/core/study-countries/${scId}/notifications/${id}`, {observe: "response", responseType: 'json'});
    }
}
