import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor( private http: HttpClient) { }

  getUser() {
    return this.http.get(`${environment.userInfoUrl}`);
  }

  getUserRoleInfo(payload) {
    return this.http.post(`${environment.baseUrlApi}/users/login`, payload);
  }

  getUserAccessData(userId) {
    return this.http.get(`${environment.baseUrlApi}/users/${userId}/access-data`);
  }
}
