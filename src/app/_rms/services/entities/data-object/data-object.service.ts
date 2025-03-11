import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})

export class DataObjectService {

  constructor( private http: HttpClient) { }
  
  // MDR related calls
  // Parameters are the SdSid of the parent study in the RMS, 
  // and integer id of the object in the MDR
  getFullObjectFromMdr(sdSid: string, mdrId: number) {
    return this.http.get(`${base}/data-objects/mdr/${sdSid}/${mdrId}`);
  }
  
  
  // Object data - Object table data only 

  getDataObjectById(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}`);
  }
  getNextDOSdOid() {
    return this.http.get(`${base}/mdm/data-objects/next-id`);
  }
  addDataObject(payload) {
    return this.http.post(`${base}/mdm/data-objects`, payload);
  }
  editDataObject(id, payload) {
    return this.http.put(`${base}/mdm/data-objects/${id}`, payload);
  }
  deleteDataObjectById(id) {
    return this.http.delete(`${base}/mdm/data-objects/${id}`);
  }
  

  // Object instances

  getObjectInstances(sdOid,pageSize) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-instances?page_size=${pageSize}`);
  }
  getPublicObjectInstances(sdOid,pageSize) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-instances-public?page_size=${pageSize}`);
  }
  addObjectInstance(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-instances`, payload);
  }
  getObjectInstance(id, sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-instances/${id}`);
  }
   editObjectInstance(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-instances/${id}`, payload);
  }
  deleteObjectInstance(id, sdOid) {
    return this.http.delete(`${base}/mdm/data-objects/${sdOid}/object-instances/${id}`);
  }

  
  // Object titles

  getObjectTitles(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-titles`);
  }
  addObjectTitle(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-titles`, payload);
  }
  getObjectTitle(id, sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-titles/${id}`);
  }
  editObjectTitle(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-titles/${id}`, payload);
  }
  deleteObjectTitle(id, sdOid) {
    return this.http.delete(`${base}/mdm/data-objects/${sdOid}/object-titles/${id}`);
  }


  // Object dates

  getObjectDates(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-dates`);
  }
  addObjectDate(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-dates`, payload);
  }
  getObjectDate(id, sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-dates/${id}`);
  }
  editObjectDate(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-dates/${id}`, payload);
  }
  deleteObjectDate(id, sdOid) {
    return this.http.delete(`${base}/mdm/data-objects/${sdOid}/object-dates/${id}`);
  }
  

  // Object datasets

  getObjectDatasets(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-datasets`);
  }
  addObjectDataset(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-datasets`, payload);
  }
  getObjectDataset(id, sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-datasets/${id}`);
  }
  editObjectDataset(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-datasets/${id}`, payload);
  }
  deleteObjectDataset(id, sdOid) {
    return this.http.delete(`${base}/data-objects/${sdOid}/datasets/${id}`);
  }


  // Object topics

  getObjectTopics(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-topics`);
  }
  addObjectTopic(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-topics`, payload);
  }
  getObjectTopic(id, sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-topics/${id}`);
  }
  editObjectTopic(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-topics/${id}`, payload);
  }
  deleteObjectTopic(id, sdOid) {
    return this.http.delete(`${base}/mdm/data-objects/${sdOid}/object-topics/${id}`);
  }
  

  // Object relationships

  getObjectRelationships(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-relationships`);
  }
  addObjectRelationship(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-relationships`, payload);
  }
  getObjectRelationship(id, sdOid) {
    return this.http.get(`${base}/data-objects/${sdOid}/relationships/${id}`);
  }
  editObjectRelationship(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-relationships/${id}`, payload);
  }
  deleteObjectRelationship(id, sdOid) {
    return this.http.delete(`${base}/mdm/data-objects/${sdOid}/object-relationships/${id}`);
  }


  // Object contributors

  getObjectContributors(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-contributors`);
  }
  addObjectContributor(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-contributors`, payload);
  }
  getObjectContributor(id, sdOid) {
    return this.http.get(`${base}/data-objects/${sdOid}/contributors/${id}`);
  }
  editObjectContributor(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-contributors/${id}`, payload);
  }
  deleteObjectContributor(id, sdOid) {
    return this.http.delete(`${base}/data-objects/${sdOid}/contributors/${id}`);
  }


  // Object descriptions

  getObjectDescriptions(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-descriptions`);
  }
  addObjectDescription(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-descriptions`, payload);
  }
  getObjectDescription(id, sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-descriptions/${id}`);
  }
  editObjectDescription(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-descriptions/${id}`, payload);
  }
  deleteObjectDescription(id, sdOid) {
    return this.http.delete(`${base}/mdm/data-objects/${sdOid}/object-descriptions/${id}`);
  }


  // Object Rights

  getObjectRights(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-rights`);
  }
  addObjectRight(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-rights`, payload);
  }
  getObjectRight(id, sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-rights/${id}`);
  }
  editObjectRight(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-rights/${id}`, payload);
  }
  deleteObjectRight(id, sdOid) {
    return this.http.delete(`${base}/mdm/data-objects/${sdOid}/object-rights/${id}`);
  }


  // Object identifiers

  getObjectIdentifiers(sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-identifiers`);
  }
  addObjectIdentifier(sdOid, payload) {
    return this.http.post(`${base}/mdm/data-objects/${sdOid}/object-identifiers`, payload);
  }
  getObjectIdentifier(id, sdOid) {
    return this.http.get(`${base}/mdm/data-objects/${sdOid}/object-identifiers/${id}`);
  }
  editObjectIdentifier(id, sdOid, payload) {
    return this.http.put(`${base}/mdm/data-objects/${sdOid}/object-identifiers/${id}`, payload);
  }
  deleteObjectIdentifier(id, sdOid) {
    return this.http.delete(`${base}/mdm/data-objects/${sdOid}/object-identifiers/${id}`);
  }

  // check number of linked DTP and DUP
  objectInvolvementDtp(sdOid) {
    return this.http.get(`${base}/mdm/dtp/object-involvement?objectId=${sdOid}`);
  }
  objectInvolvementDup(sdOid) {
    return this.http.get(`${base}/mdm/dup/object-involvement?objectId=${sdOid}`);
  }
  
 }
