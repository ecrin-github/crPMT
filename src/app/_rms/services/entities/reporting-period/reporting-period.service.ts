import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class ReportingPeriodService {

  constructor(private http: HttpClient) { }

  /* Reporting Period CRUD */
  addReportingPeriod(payload) {
    return this.http.post(`${base}/core/reporting-periods`, payload);
  }
  getReportingPeriod(id) {
    return this.http.get(`${base}/core/reporting-periods/${id}`);
  }
  editReportingPeriod(id, payload) {
    return this.http.put(`${base}/core/reporting-periods/${id}`, payload);
  }
  deleteReportingPeriod(id) {
    return this.http.delete(`${base}/core/reporting-periods/${id}`, {observe: "response", responseType: 'json'});
  }
}
