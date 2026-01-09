import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class StudyService {

  constructor(private http: HttpClient) { }

  getStudyList() {
    return this.http.get(`${base}/core/studies`);
  }

  /* Study data */
  addStudy(payload) {
    return this.http.post(`${base}/core/studies`, payload);
  }
  getStudyById(id) {
    return this.http.get(`${base}/core/studies/${id}`);
  }
  editStudy(id, payload) {
    return this.http.put(`${base}/core/studies/${id}`, payload);
  }
  deleteStudyById(id) {
    return this.http.delete(`${base}/core/studies/${id}`, {observe: "response", responseType: 'json'});
  }
}
