import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class StudyLookupService {

  constructor( private http: HttpClient) { }
  
  getStudyTypes(pageSize) {
    return this.http.get(`${base}/context/study-types?page_size=${pageSize}`);
  }
  getStudyStatuses(pageSize) {
    return this.http.get(`${base}/context/study-statuses?page_size=${pageSize}`);
  }
  getGenderEligibilities(pageSize) {
    return this.http.get(`${base}/context/gender-eligibility-types?page_size=${pageSize}`);
  } 
  getFeatureTypes(pageSize) {
    return this.http.get(`${base}/context/study-feature-types?page_size=${pageSize}`);
  }
  getFeatureValues(pageSize) {
    return this.http.get(`${base}/context/study-feature-categories?page_size=${pageSize}`);
  }
  getStudyIdentifierTypes(pageSize) {
    return this.http.get(`${base}/context/identifier-types?page_size=${pageSize}`);
  }
  getStudyTitleTypes(pageSize) {
    return this.http.get(`${base}/context/title-types?page_size=${pageSize}`);
  }
  getStudyRelationshipTypes(pageSize) {
    return this.http.get(`${base}/context/study-relationship-types?page_size=${pageSize}`);
  }
  getTimeUnits(pageSize) {
    return this.http.get(`${base}/context/time-units?page_size=${pageSize}`);
  }
  getTrialRegistries(pageSize) {
    return this.http.get(`${base}/context/trial-registries?page_size=${pageSize}`);
  }
}