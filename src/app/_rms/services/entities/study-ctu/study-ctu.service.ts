import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class StudyCtuService {

  constructor(private http: HttpClient) { }

  getStudyCTU(id) {
    return this.http.get(`${base}/core/study-ctus/${id}`);
  }
  editStudyCTU(id, payload) {
    return this.http.put(`${base}/core/study-ctus/${id}`, payload);
  }
  deleteStudyCTU(id) {
    return this.http.delete(`${base}/core/study-ctus/${id}`, {observe: "response", responseType: 'json'});
  }
}
