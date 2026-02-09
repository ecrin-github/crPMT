import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor( private http: HttpClient) { }

  /* Project lists */
  getProjectList() {
    return this.http.get(`${base}/core/projects`);
  }

  getProjectsByFundingSource(fsId) {
    return this.http.get(`${base}/core/projects-by-funding-source/${fsId}`);
  }

  getProjectsByOrganisation(orgId) {
    return this.http.get(`${base}/core/projects-by-organisation/${orgId}`);
  }

  getProjectsByService(sId) {
    return this.http.get(`${base}/core/projects-by-service/${sId}`);
  }

  getProjectsByPerson(pId) {
    return this.http.get(`${base}/core/projects-by-person/${pId}`);
  }
  
  /* Project CRUD */
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
    return this.http.delete(`${base}/core/projects/${id}`, {observe: "response", responseType: 'json'});
  }

}
