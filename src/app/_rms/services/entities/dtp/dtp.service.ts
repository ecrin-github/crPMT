import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class DtpService {

  constructor( private http: HttpClient) { }
  
  // DTP record

  getDtpById(id) {
    return this.http.get(`${base}/rms/dtp/${id}`);
  }

  addDtp(payload) {
    return this.http.post(`${base}/rms/dtp`, payload);
  }

  editDtp(id, payload) {
    return this.http.put(`${base}/rms/dtp/${id}`, payload);
  }

  deleteDtpById(id) {
    return this.http.delete(`${base}/rms/dtp/${id}`);
  }
   

  // DTAs - only ever one dta / dtp, therefore code can be simpler

  addDta(dtpId, payload) {
    return this.http.post(`${base}/rms/dtp/${dtpId}/dta`, payload);
  }
  getDta(dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/dta`);
  }
  editDta(dtpId, payload, id) {
    return this.http.put(`${base}/rms/dtp/${dtpId}/dta/${id}`, payload);
  }
  deleteDta(dtpId) {
    return this.http.delete(`${base}/data-transfers/${dtpId}/dta`);
  }

  
  // DTP Studies

  getDtpStudies(dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/studies`);
  }
  addDtpStudy(dtpId, payload) {
    return this.http.post(`${base}/rms/dtp/${dtpId}/studies`, payload);
  }
  getDtpStudy(id, dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/studies/${id}`);
  }
  editDtpStudy(id, dtpId, payload) {
    return this.http.put(`${base}/rms/dtp/${dtpId}/studies/${id}`, payload);
  }
  deleteDtpStudy(id, dtpId) {
    return this.http.delete(`${base}/rms/dtp/${dtpId}/studies/${id}`);
  }


  // DTP Objects

  getDtpObjects(dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/objects`);
  }
  addDtpObject(dtpId, payload) {
    return this.http.post(`${base}/rms/dtp/${dtpId}/objects`, payload);
  }
  getDtpObject(id, dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/objects/${id}`);
  }
  editDtpObject(id, dtpId, payload) {
    return this.http.put(`${base}/rms/dtp/${dtpId}/objects/${id}`, payload);
  }
  deleteDtpObject(id, dtpId) {
    return this.http.delete(`${base}/rms/dtp/${dtpId}/objects/${id}`);
  }
  

  // DTP People

  getDtpPeople(dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/people`);
  }
  addDtpPerson(dtpId, payload) {
    return this.http.post(`${base}/rms/dtp/${dtpId}/people`, payload);
  }
  getDtpPerson(id, dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/people/${id}`);
  }
  editDtpPerson(id, dtpId, payload) {
    return this.http.put(`${base}/rms/dtp/${dtpId}/people/${id}`, payload);
  }
  deleteDtpPerson(id, dtpId) {
    return this.http.delete(`${base}/rms/dtp/${dtpId}/people/${id}`);
  }


  // DTP Notes

  getDtpNotes(dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/notes`);
  }
  addDtpNote(dtpId, payload) {
    return this.http.post(`${base}/rms/dtp/${dtpId}/notes`, payload);
  }
  getDtpNote(id, dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/notes/${id}`);
  }
  editDtpNote(id, dtpId, payload) {
    return this.http.put(`${base}/rms/dtp/${dtpId}/notes/${id}`, payload);
  }
  deleteDtpNote(id, dtpId) {
    return this.http.delete(`${base}/rms/dtp/${dtpId}/notes/${id}`);
  }


  // DTP Object pre-requisites

  getDtpObjectPrereqs(dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/prereqs`);
  }
  addDtpObjectPrereq(dtpId, payload) {
    return this.http.post(`${base}/rms/dtp/${dtpId}/prereqs`, payload);
  }
  getDtpObjectPrereq(id, sdOid, dtpId) {
    return this.http.get(`${base}/rms/dtp/${dtpId}/objects/${sdOid}/prereqs/${id}`);
  }
  editDtpObjectPrereq(id, dtpId, payload) {
    return this.http.put(`${base}/rms/dtp/${dtpId}/prereqs/${id}`, payload);
  }
  deleteDtpObjectPrereq(id, dtpId) {
    return this.http.delete(`${base}/rms/dtp/${dtpId}/prereqs/${id}`);
  }


  // DTP object dataset sdata - none or one per object

  addDtpObjectDataset(dtpId, sdOid, payload) {
    return this.http.post(`${base}/data-transfers/${dtpId}/objects/${sdOid}/dataset`, payload);
  }
  getDtpObjectDataset(id, sdOid, dtpId) {
    return this.http.get(`${base}/data-transfers/${dtpId}/objects/${sdOid}/dataset`);
  }
  editDtpObjectDataset(id, sdOid, dtpId, payload) {
    return this.http.put(`${base}/data-transfers/${dtpId}/objects/${sdOid}/dataset`, payload);
  }
}
