import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class VisitService {

  constructor(private http: HttpClient) { }

  /* Visit lists */
  getVisits(sid) {
    return this.http.get(`${base}/core/centres/${sid}/visits`);
  }
  getStudyCTUVisits(sctuId) {
    return this.http.get(`${base}/core/study-ctus/${sctuId}/visits`);
  }
  
  /* Visit CRUD */
  addVisitFromCentre(cid, payload) {
    return this.http.post(`${base}/core/centres/${cid}/visits`, payload);
  }

  getVisit(id) {
    return this.http.get(`${base}/core/visits/${id}`);
  }
  editVisit(id, payload) {
    return this.http.put(`${base}/core/visits/${id}`, payload);
  }
  deleteVisit(id) {
    return this.http.delete(`${base}/core/visits/${id}`, {observe: "response", responseType: 'json'});
  }
}
