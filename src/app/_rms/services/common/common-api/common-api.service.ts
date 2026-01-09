import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class CommonApiService {

  constructor(private http: HttpClient) { }

  getReferenceCountByClass(id, className) {
    return this.http.get(`${base}/core/reference-count-by-class/${className}/${id}`);
  }
}