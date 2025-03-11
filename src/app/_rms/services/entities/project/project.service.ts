import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor( private http: HttpClient) { }
  
  /* project data */
  addProject(payload) {
    return this.http.post(`${base}/core/projects`, payload);
  }
  getProjectById(id) {
    return this.http.get(`${base}/core/projects/${id}`);
  }
  editProject(id, payload) {
    return this.http.put(`${base}/core/projects/${id}`, payload);
  }
  deleteProjectById(id) {
    return this.http.delete(`${base}/core/projects/${id}`);
  }

}
