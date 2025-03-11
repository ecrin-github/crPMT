import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class ObjectLookupService {

  constructor( private http: HttpClient) { }

  // lookups
  getObjectClasses(pageSize) {
    return this.http.get(`${base}/context/object-classes?page_size=${pageSize}`);
  }
  getObjectTypes(pageSize) {
    return this.http.get(`${base}/context/object-types?page_size=${pageSize}`);
  }
  getObjectTitleTypes(pageSize) {
    return this.http.get(`${base}/context/title-types?page_size=${pageSize}`);
  }
  getAccessTypes(pageSize) {
    return this.http.get(`${base}/context/object-access-types?page_size=${pageSize}`);
  }
  getRecordKeyTypes(pageSize) {
    return this.http.get(`${base}/context/dataset-recordkey-types?page_size=${pageSize}`);
  }
  getDeidentificationTypes(pageSize) {
    return this.http.get(`${base}/context/dataset-deidentification-levels?page_size=${pageSize}`);
  }
  getConsentTypes(pageSize) {
    return this.http.get(`${base}/context/dataset-consent-types?page_size=${pageSize}`);
  }
  getSizeUnits(pageSize) {
    return this.http.get(`${base}/context/size-units?page_size=${pageSize}`);
  }
  getResourceTypes(pageSize) {
    return this.http.get(`${base}/context/resource-types?page_size=${pageSize}`);
  }
  getDateTypes(pageSize) {
    return this.http.get(`${base}/context/date-types?page_size=${pageSize}`);
  }
  getDescriptionTypes(pageSize) {
    return this.http.get(`${base}/context/description-types?page_size=${pageSize}`);
  }
  getObjectIdentifierTypes(pageSize) {
    return this.http.get(`${base}/context/identifier-types?page_size=${pageSize}`);
  }
  getObjectRelationshipTypes(pageSize) {
    return this.http.get(`${base}/context/object-relationship-types?page_size=${pageSize}`);
  }
}