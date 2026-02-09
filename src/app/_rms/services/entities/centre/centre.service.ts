import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class CentreService {

  constructor(private http: HttpClient) { }

  /* Centre lists */
  getCentres(sid) {
    return this.http.get(`${base}/core/studies/${sid}/centres`);
  }
  getStudyCTUCentres(sctuId) {
    return this.http.get(`${base}/core/study-ctus/${sctuId}/centres`);
  }
  
  /* Centre CRUD */
  addCentreFromStudy(sid, payload) {
    return this.http.post(`${base}/core/studies/${sid}/centres`, payload);
  }
  addCentreFromStudyCTU(sctuId, payload) {
    return this.http.post(`${base}/core/study-ctus/${sctuId}/centres`, payload);
  }

  getCentre(id) {
    return this.http.get(`${base}/core/centres/${id}`);
  }
  editCentre(id, payload) {
    return this.http.put(`${base}/core/centres/${id}`, payload);
  }
  deleteCentre(id) {
    return this.http.delete(`${base}/core/centres/${id}`, {observe: "response", responseType: 'json'});
  }
}
