import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {

  constructor(private http: HttpClient) { }

    getSubmission(id) {
      return this.http.get(`${base}/core/submissions/${id}`);
    }
    editSubmission(id, payload) {
      return this.http.put(`${base}/core/submissions/${id}`, payload);
    }
    deleteSubmission(id) {
      return this.http.delete(`${base}/core/submissions/${id}`, {observe: "response", responseType: 'json'});
    }
}
