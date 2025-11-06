import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private http: HttpClient) { }

    getNotification(id) {
      return this.http.get(`${base}/core/notifications/${id}`);
    }
    editNotification(id, payload) {
      return this.http.put(`${base}/core/notifications/${id}`, payload);
    }
    deleteNotification(id) {
      return this.http.delete(`${base}/core/notifications/${id}`, {observe: "response", responseType: 'json'});
    }
}
