import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class ProcessLookupService {

  constructor( private http: HttpClient) { }

  getDtpStatusTypes() {
    return this.http.get(`${base}/context/dtp-status-types`);
  }
  
  getDupStatusTypes() {
    return this.http.get(`${base}/context/dup-status-types`);
  }
  
  getLegalStatusTypes() {
    return this.http.get(`${base}/legal-status-types/simple`);
  }
  
  getPrereqTypes(pageSize) {
    return this.http.get(`${base}/context/access-prereq-types?page_size=${pageSize}`);
  }
    
  getRepoAccessTypes(pageSize) {
    return this.http.get(`${base}/context/object-access-types?page_size=${pageSize}`);
  }
  
  getRmsUserTypes() {
    return this.http.get(`${base}/rms-user-types/simple`);
  }
  getObjectAccessTypes(pageSize) {
    return this.http.get(`${base}/context/check-status-types?page_size=${pageSize}`);
  }
  
}