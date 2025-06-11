import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class StudyService {

  constructor( private http: HttpClient) { }

  /* Study data */
  addStudy(payload) {
    return this.http.post(`${base}/core/studies`, payload);
  }
  getStudyById(id) {
    return this.http.get(`${base}/core/studies/${id}`);
  }
  editStudy(id, payload) {
    return this.http.put(`${base}/core/studies/${id}`, payload);
  }
  deleteStudyById(id) {
    return this.http.delete(`${base}/core/studies/${id}`, {observe: "response", responseType: 'json'});
  }

  /* Study countries */

  getStudyCountries(sid) {
    return this.http.get(`${base}/core/studies/${sid}/study-countries`);
  }
  addStudyCountry(sid, payload) {
    return this.http.post(`${base}/core/studies/${sid}/study-countries`, payload);
  }
  getStudyCountry(sid, id) {
    return this.http.get(`${base}/core/studies/${sid}/study-countries/${id}`);
  }
  editStudyCountry(sid, id, payload) {
    return this.http.put(`${base}/core/studies/${sid}/study-countries/${id}`, payload);
  }
  deleteStudyCountry(sid, id) {
    return this.http.delete(`${base}/core/studies/${sid}/study-countries/${id}`, {observe: "response", responseType: 'json'});
  }
  
  /* Study CTUs from study */

  getStudyCTUs(sid) {
    return this.http.get(`${base}/core/studies/${sid}/study-ctus`);
  }
  addStudyCTUFromStudy(sid, payload) {
    return this.http.post(`${base}/core/studies/${sid}/study-ctus`, payload);
  }
  getStudyCTUFromStudy(sid, id) {
    return this.http.get(`${base}/core/studies/${sid}/study-ctus/${id}`);
  }
  editStudyCTUFromStudy(sid, id, payload) {
    return this.http.put(`${base}/core/studies/${sid}/study-ctus/${id}`, payload);
  }
  deleteStudyCTUFromStudy(sid, id) {
    return this.http.delete(`${base}/core/studies/${sid}/study-ctus/${id}`, {observe: "response", responseType: 'json'});
  }
  
  /* Study CTUs from study country */

  getStudyCountryCTUs(scid) {
    return this.http.get(`${base}/core/study-countries/${scid}/study-ctus`);
  }
  addStudyCTUFromStudyCountry(scid, payload) {
    return this.http.post(`${base}/core/study-countries/${scid}/study-ctus`, payload);
  }
  getStudyCTUFromStudyCountry(scid, id) {
    return this.http.get(`${base}/core/study-countries/${scid}/study-ctus/${id}`);
  }
  editStudyCTUFromStudyCountry(scid, id, payload) {
    return this.http.put(`${base}/core/study-countries/${scid}/study-ctus/${id}`, payload);
  }
  deleteStudyCTUFromStudyCountry(scid, id) {
    return this.http.delete(`${base}/core/study-countries/${scid}/study-ctus/${id}`, {observe: "response", responseType: 'json'});
  }


  // study identifiers

  getStudyIdentifiers(sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-identifiers`);
  }
  addStudyIdentifier(sdSid, payload) {
    return this.http.post(`${base}/mdm/studies/${sdSid}/study-identifiers`, payload);
  }
  getStudyIdentifier(id, sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-identifiers/${id}`);
  }
  editStudyIdentifier(id, sdSid, payload) {
    return this.http.put(`${base}/mdm/studies/${sdSid}/study-identifiers/${id}`, payload);
  }
  deleteStudyIdentifier(id, sdSid) {
    return this.http.delete(`${base}/mdm/studies/${sdSid}/study-identifiers/${id}`);
  }


  // study titles

  getStudyTitles(sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-titles`);
  }
  addStudyTitle(sdSid, payload) {
    return this.http.post(`${base}/mdm/studies/${sdSid}/study-titles`, payload);
  }
  getStudyTitle(id, sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-titles/${id}`);
  }
  editStudyTitle(id, sdSid, payload) {
    return this.http.put(`${base}/mdm/studies/${sdSid}/study-titles/${id}`, payload);
  }
  deleteStudyTitle(id, sdSid) {
    return this.http.delete(`${base}/mdm/studies/${sdSid}/study-titles/${id}`);
  }


  // study features
  getStudyFeatures(sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-features`);
  }
  addStudyFeature(sdSid, payload) {
    return this.http.post(`${base}/mdm/studies/${sdSid}/study-features`, payload);
  }
  getStudyFeature(id, sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-features/${id}`);
  }
  editStudyFeature(id, sdSid, payload) {
    return this.http.put(`${base}/mdm/studies/${sdSid}/study-features/${id}`, payload);
  }
  deleteStudyFeature(id, sdSid) {
    return this.http.delete(`${base}/mdm/studies/${sdSid}/study-features/${id}`);
  }


  // study topics
  getStudyTopics(sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-topics`);
  }
  addStudyTopic(sdSid, payload) {
    return this.http.post(`${base}/mdm/studies/${sdSid}/study-topics`, payload);
  }
  getStudyTopic(id, sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-topics/${id}`);
  }
  editStudyTopic(id, sdSid, payload) {
    return this.http.put(`${base}/mdm/studies/${sdSid}/study-topics/${id}`, payload);
  }
  deleteStudyTopic(id, sdSid) {
    return this.http.delete(`${base}/mdm/studies/${sdSid}/study-topics/${id}`);
  }
  

  // study relationships
  getStudyRelationships(sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-relationships`);
  }
  addStudyRelationship(sdSid, payload) {
    return this.http.post(`${base}/mdm/studies/${sdSid}/study-relationships`, payload);
  }
  getStudyRelationship(id, sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-relationships/${id}`);
  }
  editStudyRelationship(id, sdSid, payload) {
    return this.http.put(`${base}/mdm/studies/${sdSid}/study-relationships/${id}`, payload);
  }
  deleteStudyRelationship(id, sdSid) {
    return this.http.delete(`${base}/mdm/studies/${sdSid}/study-relationships/${id}`);
  }


  // study contributors
  getStudyContributors(sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-contributors`);
  }
  addStudyContributor(sdSid, payload) {
    return this.http.post(`${base}/mdm/studies/${sdSid}/study-contributors`, payload);
  }
  getStudyContributor(id, sdSid) {
    return this.http.get(`${base}/mdm/studies/${sdSid}/study-contributors/${id}`);
  }
  editStudyContributor(id, sdSid, payload) {
    return this.http.put(`${base}/mdm/studies/${sdSid}/study-contributors/${id}`, payload);
  }
  deleteStudyContributor(id, sdSid) {
    return this.http.delete(`${base}/mdm/studies/${sdSid}/study-contributors/${id}`);
  }

  // check number of linked DTP and DUP
  studyInvolvementDtp(sdSid) {
    return this.http.get(`${base}/mdm/dtp/study-involvement?studyId=${sdSid}`);
  }
  studyInvolvementDup(sdSid) {
    return this.http.get(`${base}/mdm/dup/study-involvement?studyId=${sdSid}`);
  }

  // check number of linked objects
  linkedObject(sdSid){
    return this.http.get(`${base}/studies/${sdSid}/objects`);
  }

}
