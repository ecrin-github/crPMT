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
    // editStudyCountry(sid, id, payload) {
    //   return this.http.put(`${base}/core/studies/${sid}/study-countries/${id}`, payload);
    // }
    // deleteStudyCountry(sid, id) {
    //   return this.http.delete(`${base}/core/studies/${sid}/study-countries/${id}`, {observe: "response", responseType: 'json'});
    // }
}
