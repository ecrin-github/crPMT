import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class DupService {

  constructor( private http: HttpClient) { }
  
  // full DUP - with attributes

  getFullDupById(id) {
    return this.http.get(`${base}/data-uses/full/${id}`);
  }

  deleteFullDupById(id) {
    return this.http.delete(`${base}/data-uses/full/${id}`);
  }

  // check for deletion
  // checkDupAgreed(dupId) {
  //   return this.http.get(`${base}/data-uses/${dupId}`);
  // }


    // DUP record - core record only

  getDupById(id) {
    return this.http.get(`${base}/rms/dup/${id}`);
  }

  getDupByIdWfkn(id) {
    return this.http.get(`${base}/data-uses/with-fk-names/${id}`);
  }

  addDup(payload) {
    return this.http.post(`${base}/rms/dup`, payload);
  }

  editDup(id, payload) {
    return this.http.put(`${base}/rms/dup/${id}`, payload);
  }

  deleteDupById(id) {
    return this.http.delete(`${base}/rms/dup/${id}`);
  }
  

  // DUAs - only ever one Dua / Dup, therefore code can be simpler

  addDua(dupId, payload) {
    return this.http.post(`${base}/rms/dup/${dupId}/dua`, payload);
  }
  getDua(dupId) {
    return this.http.get(`${base}/rms/dup/${dupId}/dua`);
  }
  getDuaWfkn(dupId) {
    return this.http.get(`${base}/data-uses/with-fk-names/${dupId}/dta`);
  }
  editDua(dupId, id, payload) {
    return this.http.put(`${base}/rms/dup/${dupId}/dua/${id}`, payload);
  }
  deleteDua(dupId) {
    return this.http.delete(`${base}/data-uses/${dupId}/Dua`);
  }


  // Dup Studies

  getDupStudies(dupId) {
    return this.http.get(`${base}/rms/dup/${dupId}/studies`);
  }
  getDupStudiesWfkn(dupId) {
    return this.http.get(`${base}/data-uses/with-fk-names/${dupId}/studies`);
  }
  addDupStudy(dupId, payload) {
    return this.http.post(`${base}/rms/dup/${dupId}/studies`, payload);
  }
  getDupStudy(id, dupId) {
    return this.http.get(`${base}/data-uses/${dupId}/studies/${id}`);
  }
  getDupStudyWfkn(id, dupId) {
    return this.http.get(`${base}/data-uses/with-fk-names/${dupId}/studies/${id}`);
  }
  editDupStudy(id, dupId, payload) {
    return this.http.put(`${base}/data-uses/${dupId}/studies/${id}`, payload);
  }
  deleteDupStudy(id, dupId) {
    return this.http.delete(`${base}/rms/dup/${dupId}/studies/${id}`);
  }


  // Dup Objects

  getDupObjects(dupId) {
    return this.http.get(`${base}/rms/dup/${dupId}/objects`);
  }
  getDupObjectsWfkn(dupId) {
    return this.http.get(`${base}/data-uses/with-fk-names/${dupId}/objects`);
  }
  addDupObject(dupId, payload) {
    return this.http.post(`${base}/rms/dup/${dupId}/objects`, payload);
  }
  getDupObject(id, dupId) {
    return this.http.get(`${base}/data-uses/${dupId}/objects/${id}`);
  }
  getDupObjectWfkn(id, dupId) {
    return this.http.get(`${base}/data-uses/with-fk-names/${dupId}/objects/${id}`);
  }
  editDupObject(id, dupId, payload) {
    return this.http.put(`${base}/data-uses/${dupId}/objects/${id}`, payload);
  }
  deleteDupObject(id, dupId) {
    return this.http.delete(`${base}/rms/dup/${dupId}/objects/${id}`);
  }


  // Dup People

  getDupPeople(dupId) {
    return this.http.get(`${base}/rms/dup/${dupId}/people`);
  }
  getDupPeopleWfkn(dupId) {
    return this.http.get(`${base}/data-uses/with-fk-names/${dupId}/people`);
  }
  addDupPerson(dupId, payload) {
    return this.http.post(`${base}/rms/dup/${dupId}/people`, payload);
  }
  getDupPerson(id, dupId) {
    return this.http.get(`${base}/data-uses/${dupId}/people/${id}`);
  }
  getDupPersonWfkn(id, dupId) {
    return this.http.get(`${base}/data-uses/with-fk-names/${dupId}/people/${id}`);
  }
  editDupPerson(id, dupId, payload) {
    return this.http.put(`${base}/data-uses/${dupId}/people/${id}`, payload);
  }
  deleteDupPerson(id, dupId) {
    return this.http.delete(`${base}/rms/dup/${dupId}/people/${id}`);
  }


  // Dup Notes

  getDupNotes(dupId) {
    return this.http.get(`${base}/rms/dup/${dupId}/notes`);
  }
  getDupNotesWfkn(dupId) {
    return this.http.get(`${base}/data-uses/with-fk-names/${dupId}/notes`);
  }
  addDupNote(dupId, payload) {
    return this.http.post(`${base}/rms/dup/${dupId}/notes`, payload);
  }
  getDupNote(id, dupId) {
    return this.http.get(`${base}/data-uses/${dupId}/notes/${id}`);
  }
  getDupNoteWfkn(id, dupId) {
    return this.http.get(`${base}/data-uses/with-fk-names/${dupId}/notes/${id}`);
  }
  editDupNote(id, dupId, payload) {
    return this.http.put(`${base}/rms/dup/${dupId}/notes/${id}`, payload);
  }
  deleteDupNote(id, dupId) {
    return this.http.delete(`${base}/rms/dup/${dupId}/notes/${id}`);
  }


  // Dup Object pre-requisites -- read only from DTP prereqs table

  getDupObjectPrereqs(dataObjectsIds) {
    return this.http.get(`${base}/mdm/dup/prereqs?dataObjectIds=${dataObjectsIds}`);
  }

  // DUP secondary use

  getDupSecUses(dupId) {
    return this.http.get(`${base}/data-uses/${dupId}/secondary-use`);
  }
  addDupSecUse(dupId, payload) {
    return this.http.post(`${base}/data-uses/${dupId}/secondary-use`, payload);
  }
  getDupSecUse(id, dupId) {
    return this.http.get(`${base}/data-uses/${dupId}/secondary-use/${id}`);
  }
  editDupSecUse(id, dupId, payload) {
    return this.http.put(`${base}/data-uses/${dupId}/secondary-use/${id}`, payload);
  }
  deleteDupSecUse(id, dupId) {
    return this.http.delete(`${base}/data-uses/${dupId}/secondary-use/${id}`);
  }
}
