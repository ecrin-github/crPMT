import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class SafetyNotificationService {

  constructor(private http: HttpClient) { }

  /* Safety Notification CRUD */
  addSafetyNotification(payload) {
    return this.http.post(`${base}/core/safety-notifications`, payload);
  }
  getSafetyNotification(id) {
    return this.http.get(`${base}/core/safety-notifications/${id}`);
  }
  editSafetyNotification(id, payload) {
    return this.http.put(`${base}/core/safety-notifications/${id}`, payload);
  }
  deleteSafetyNotification(id) {
    return this.http.delete(`${base}/core/safety-notifications/${id}`, {observe: "response", responseType: 'json'});
  }
}