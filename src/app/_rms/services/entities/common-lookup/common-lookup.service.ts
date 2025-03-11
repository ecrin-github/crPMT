import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;
const baseApi = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class CommonLookupService {

  constructor( private http: HttpClient) { }

  getTopicTypes(pageSize) {
    return this.http.get(`${baseApi}/context/topic-types?page_size=${pageSize}`);
  }
  getTopicVocabularies(pageSize) {
    return this.http.get(`${baseApi}/context/topic-vocabularies?page_size=${pageSize}`);
  }
  getContributorTypes(pageSize) {
    return this.http.get(`${baseApi}/context/contributor-types?page_size=${pageSize}`);
  }
  getOrganizationList(pageSize) {
    return this.http.get(`${baseApi}/general/organisations?page_size=${pageSize}`);
  }
  getOrganizationById(orgId) {
    return this.http.get(`${baseApi}/general/organisations/${orgId}`);
  }


  getLanguageCodes(pageSize) {
    return this.http.get(`${baseApi}/general/language-codes?page_size=${pageSize}`);
  }
  //  checks if an object is linked to a dtp/dup without associated study
  // objectInvolvement(sdSid) {
  //   return this.http.get(`${baseApi}/mdm/dtp/object-involvement?objectId=${sdSid}`);
  // }
  objectInvolvementDtp(dtpId, sdSid) {
    return this.http.get(`${baseApi}/mdm/dtp/${dtpId}/study-involvement?studyId=${sdSid}`);
  }
  objectInvolvementDup(dupId, sdSid) {
    return this.http.get(`${baseApi}/mdm/dup/${dupId}/study-involvement?studyId=${sdSid}`);
  }
  emailAPI(payload) {
    return this.http.post(`${baseUrl}/app/send-email`, payload);
  }
}