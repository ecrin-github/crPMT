import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CountryInterface } from '../../interfaces/context/country.interface';
import { CTUInterface } from '../../interfaces/context/ctu.interface';
import { PersonInterface } from '../../interfaces/context/person.interface';
import { OrganisationInterface } from '../../interfaces/context/organisation.interface';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProjectInterface } from '../../interfaces/project/project.interface';
import { ListService } from '../entities/list/list.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonModalComponent } from 'src/app/pages/common/person-modal/person-modal.component';
import { OrganisationModalComponent } from 'src/app/pages/common/organisation-modal/organisation-modal.component';
import { ClassValueInterface } from '../../interfaces/context/class-value.interface';
import { HospitalModalComponent } from 'src/app/pages/common/hospital-modal/hospital-modal.component';
import { HospitalInterface } from '../../interfaces/context/hospital.interface';
import { CtuModalComponent } from 'src/app/pages/common/ctu-modal/ctu-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  public complexTrialTypes: BehaviorSubject<ClassValueInterface[]> =
        new BehaviorSubject<ClassValueInterface[]>(null);
  public countries: BehaviorSubject<CountryInterface[]> =
        new BehaviorSubject<CountryInterface[]>(null);
  public ctus: BehaviorSubject<CTUInterface[]> =
        new BehaviorSubject<CTUInterface[]>(null);
  public hospitals: BehaviorSubject<HospitalInterface[]> =
        new BehaviorSubject<HospitalInterface[]>(null);
  public fundingSources: BehaviorSubject<ClassValueInterface[]> =
        new BehaviorSubject<ClassValueInterface[]>(null);
  public medicalFields: BehaviorSubject<ClassValueInterface[]> =
        new BehaviorSubject<ClassValueInterface[]>(null);
  public organisations: BehaviorSubject<OrganisationInterface[]> =
        new BehaviorSubject<OrganisationInterface[]>(null);
  public persons: BehaviorSubject<PersonInterface[]> =
        new BehaviorSubject<PersonInterface[]>(null);
  public populations: BehaviorSubject<ClassValueInterface[]> =
        new BehaviorSubject<ClassValueInterface[]>(null);
  public regulatoryFrameworkDetails: BehaviorSubject<ClassValueInterface[]> =
        new BehaviorSubject<ClassValueInterface[]>(null);
  public services: BehaviorSubject<ClassValueInterface[]> =
        new BehaviorSubject<ClassValueInterface[]>(null);

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private listService: ListService,
    private toastr: ToastrService) {
    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries
    let queryFuncs: Array<Observable<any>> = [];

    queryFuncs.push(this.getComplexTrialTypes());
    queryFuncs.push(this.getCountries());
    queryFuncs.push(this.getCTUs());
    queryFuncs.push(this.getHospitals());
    queryFuncs.push(this.getFundingSources());
    queryFuncs.push(this.getMedicalFields());
    queryFuncs.push(this.getOrganisations());
    queryFuncs.push(this.getPersons());
    queryFuncs.push(this.getPopulations());
    queryFuncs.push(this.getRegulatoryFrameworkDetails());
    queryFuncs.push(this.getServices());

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error.error.title)))));
    });

    combineLatest(obsArr).subscribe(res => {
      this.setServices(res.pop());
      this.setRegulatoryFrameworkDetails(res.pop());
      this.setPopulations(res.pop());
      this.setPersons(res.pop());
      this.setOrganisations(res.pop());
      this.setMedicalFields(res.pop());
      this.setFundingSources(res.pop());
      this.setHospitals(res.pop());
      this.setCTUs(res.pop());
      this.setCountries(res.pop());
      this.setComplexTrialTypes(res.pop());
    });
  }

  searchClassValues(term, item) {
    term = term.toLocaleLowerCase();
    return item.value?.toLocaleLowerCase().indexOf(term) > -1;
  }

  sortClassValues(items) {
    const { compare } = Intl.Collator('en-GB');
    items.sort((a, b) => { return compare(a.value, b.value); });
  }

  getComplexTrialTypes() {
    return this.http.get(`${environment.baseUrlApi}/context/complex-trial-types`);
  }

  setComplexTrialTypes(complexTrialTypes) {
    this.sortClassValues(complexTrialTypes);
    this.complexTrialTypes.next(complexTrialTypes);
  }

  addComplexTrialType(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/complex-trial-types`, payload);
  }

  deleteComplexTrialType(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/complex-trial-types/${id}`, {observe: "response", responseType: 'json'});
  }

  updateComplexTrialTypes() {
    return this.getComplexTrialTypes().pipe(
      map((ctts) => {
        this.setComplexTrialTypes(ctts);
      })
    );
  }

  /**
   * TODO
   * @param value 
   * @returns 
   */
  addComplexTrialTypeDropdown(value) {
    let ctt = {"id": "", "value": ""};
    
    this.spinner.show();
    return this.addComplexTrialType({'value': value}).pipe(
      mergeMap((c: any) => {
        ctt.id = c.id;
        ctt.value = c.value;
        return this.updateComplexTrialTypes();
      }),
      mergeMap(() => {
        this.spinner.hide();
        return of(ctt);
      }),
      catchError((err) => {
        this.toastr.error(err, "Error adding complex trial type", { timeOut: 20000, extendedTimeOut: 20000 });
        return of(null);
      })
    ).toPromise();
  }

  deleteComplexTrialTypeDropdown(cttToRemove, filter) {
    this.spinner.show();
    // Checking if other projects have this complex trial type
    this.listService.getReferenceCountByClass("complextrialtype", cttToRemove.id).subscribe((res: any) => {
      let refCount = res.totalCount;
      // Allowing deletion if complex trial type has already been added and is only referenced once by the calling class
      if (filter) { // !isAdd
        refCount -= 1;
      }

      if (refCount > 0) {
        this.toastr.error(`Failed to delete this complex trial type as it is used in ${refCount} other objects (projects, studies, etc.)`);
        this.spinner.hide();
      } else {
        // Delete type from the DB, then locally if succeeded
        this.deleteComplexTrialType(cttToRemove.id).subscribe((res: any) => {
          if (res.status !== 204) {
            this.toastr.error('Error when deleting complex trial type', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
            this.spinner.hide();
          } else {
            this.updateComplexTrialTypes().subscribe(() => {
              this.spinner.hide();
            });
          }
        }, error => {
          this.toastr.error(error);
          this.spinner.hide();
        });
      }
    }, error => {
      this.toastr.error(error);
      this.spinner.hide();
    });
  }

  /* Countries */
  getCountries() {
    return this.http.get(`${environment.baseUrlApi}/context/countries`);
  }

  sortCountries(countries) {
    const { compare } = Intl.Collator('en-GB');
    countries.sort((a, b) => { return compare(a.name, b.name); });
  }

  setCountries(countries) {
    this.sortCountries(countries);
    this.countries.next(countries);
  }

  searchCountries(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1;
  }
  
  /* CTUs */
  getCTUs() {
    return this.http.get(`${environment.baseUrlApi}/context/ctus`);
  }
  
  setCTUs(ctus) {
    this.ctus.next(ctus);
  }

  addCTU(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/ctus`, payload);
  }

  deleteCTU(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/ctus/${id}`, {observe: "response", responseType: 'json'});
  }

  updateCTUs() {
    return this.getCTUs().pipe(
      map((ctus) => {
        this.setCTUs(ctus);
      })
    );
  }

  searchCTUs(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1 
        || item.shortName?.toLocaleLowerCase().indexOf(term) > -1 
        || item.addressInfo?.toLocaleLowerCase().indexOf(term) > -1;
  }

  addCTUDropdown(ctuName) {
    const addCTU = this.modalService.open(CtuModalComponent, { size: 'lg', backdrop: 'static' });
    addCTU.componentInstance.name = ctuName;

    return addCTU.result.then((result) => {
      if (result === null) {
        this.spinner.hide();
        return new Promise(null);
      }
      
      this.spinner.show();
      return this.addCTU(result).pipe(
        mergeMap((o:any) => {
          result.id = o.id;
          return this.updateCTUs();
        }),
        mergeMap(() => {
          this.spinner.hide();
          return of(result);
        }),
        catchError((err) => {
          this.toastr.error(err, "Error adding CTU", { timeOut: 20000, extendedTimeOut: 20000 });
          return of(null);
        })
      ).toPromise();
    })
    .catch((err) => {
      this.toastr.error(err, "Error adding CTU", { timeOut: 20000, extendedTimeOut: 20000 });
      this.spinner.hide();
      return null;
    });
  }

  /**
   * 
   * @param ctuToRemove TODO
   * @param currProjectId 
   */
  deleteCTUDropdown(ctuToRemove, filter) {
    this.spinner.show();
    // Checking if other projects have this CTU
    this.listService.getReferenceCountByClass("ctu", ctuToRemove.id).subscribe((res: any) => {
      let refCount = res.totalCount;
      // Allowing deletion if CTU has already been added and is only referenced once by the calling class
      if (filter) { // !isAdd
        refCount -= 1;
      }

      if (refCount > 0) {
        this.toastr.error(`Failed to delete this CTU as it is used in ${refCount} other objects (projects, studies, etc.)`);
        this.spinner.hide();
      } else {
        // Delete CTU from the DB, then locally if succeeded
        this.deleteCTU(ctuToRemove.id).subscribe((res: any) => {
          if (res.status !== 204) {
            this.toastr.error('Error when deleting CTU', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
          } else {
            // Updating CTUs list
            this.updateCTUs().subscribe(() => {
              this.spinner.hide();
            });
          }
          this.spinner.hide();
        }, error => {
          this.toastr.error(error);
          this.spinner.hide();
        });
      }
    }, error => {
      this.toastr.error(error);
      this.spinner.hide();
    });
  }

  /* Hospitals */
  getHospitals() {
    return this.http.get(`${environment.baseUrlApi}/context/hospitals`);
  }

  setHospitals(hospitals) {
    this.sortHospitals(hospitals);
    this.hospitals.next(hospitals);
  }
  
  updateHospitals() {
    return this.getHospitals().pipe(
      map((hospitals) => {
        this.setHospitals(hospitals);
      })
    );
  }

  sortHospitals(hospitals) {
    const { compare } = Intl.Collator('en-GB');
    hospitals.sort((a, b) => { return compare(a.name, b.name); });
  }
  
  addHospital(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/hospitals`, payload);
  }

  editHospital(id, payload) {
    return this.http.put(`${environment.baseUrlApi}/context/hospitals/${id}`, payload);
  }

  deleteHospital(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/hospitals/${id}`, {observe: "response", responseType: 'json'});
  }

  searchHospitals(term, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1 
      || item.city?.toLocaleLowerCase().indexOf(term) > -1 
      || item.country?.name?.toLocaleLowerCase().indexOf(term) > -1;
  }

  /**
   * TODO
   * @param hospitalName 
   * @returns 
   */
  addHospitalDropdown(hospitalName, country) {
    const addOrgModal = this.modalService.open(HospitalModalComponent, { size: 'lg', backdrop: 'static' });
    addOrgModal.componentInstance.name = hospitalName;
    addOrgModal.componentInstance.country = country;

    return addOrgModal.result.then((result) => {
      if (result === null) {
        this.spinner.hide();
        return new Promise(null);
      }
      
      this.spinner.show();
      return this.addHospital(result).pipe(
        mergeMap((o:any) => {
          result.id = o.id;
          return this.updateHospitals();
        }),
        mergeMap(() => {
          this.spinner.hide();
          return of(result);
        }),
        catchError((err) => {
          this.toastr.error(err, "Error adding hospital", { timeOut: 20000, extendedTimeOut: 20000 });
          return of(null);
        })
      ).toPromise();
    })
    .catch((err) => {
      this.toastr.error(err, "Error adding hospital", { timeOut: 20000, extendedTimeOut: 20000 });
      this.spinner.hide();
      return null;
    });
  }

  /**
   * 
   * @param hospitalToRemove TODO
   * @param currProjectId 
   */
  deleteHospitalDropdown(hospitalToRemove, filter) {
    this.spinner.show();
    // Checking if other projects have this hospital
    this.listService.getReferenceCountByClass("hospital", hospitalToRemove.id).subscribe((res: any) => {
      let refCount = res.totalCount;
      // Allowing deletion if hospital has already been added and is only referenced once by the calling class
      if (filter) { // !isAdd
        refCount -= 1;
      }

      if (refCount > 0) {
        this.toastr.error(`Failed to delete this hospital as it is used in ${refCount} other objects (projects, studies, etc.)`);
        this.spinner.hide();
      } else {
        // Delete hospital from the DB, then locally if succeeded
        this.deleteHospital(hospitalToRemove.id).subscribe((res: any) => {
          if (res.status !== 204) {
            this.toastr.error('Error when deleting hospital', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
          } else {
            // Updating hospitals list
            this.updateHospitals().subscribe(() => {
              this.spinner.hide();
            });
          }
          this.spinner.hide();
        }, error => {
          this.toastr.error(error);
          this.spinner.hide();
        });
      }
    }, error => {
      this.toastr.error(error);
      this.spinner.hide();
    });
  }

  /* Funding sources */
  getFundingSources() {
    return this.http.get(`${environment.baseUrlApi}/context/funding-sources`);
  }

  setFundingSources(fundingSources) {
    this.fundingSources.next(fundingSources);
  }

  updateFundingSources() {
    return this.getFundingSources().pipe(
      map((fs) => {
        this.setFundingSources(fs);
      })
    );
  }

  addFundingSource(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/funding-sources`, payload);
  }

  deleteFundingSource(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/funding-sources/${id}`, {observe: "response", responseType: 'json'});
  }

  deleteFundingSourceDropdown(fsToRemove, filter) {
    this.spinner.show();
    // Checking if other projects have this funding source
    this.listService.getReferenceCountByClass("fundingsource", fsToRemove.id).subscribe((res: any) => {
      let refCount = res.totalCount;
      // Allowing deletion if funding source has already been added and is only referenced once by the calling class
      if (filter) { // !isAdd
        refCount -= 1;
      }

      if (refCount > 0) {
        this.toastr.error(`Failed to delete this funding source as it is used in ${refCount} other objects (projects, studies, etc.)`);
        this.spinner.hide();
      } else {
        // Delete funding source from the DB, then locally if succeeded
        this.deleteFundingSource(fsToRemove.id).subscribe((res: any) => {
          if (res.status !== 204) {
            this.toastr.error('Error when deleting funding source', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
            this.spinner.hide();
          } else {
            this.updateFundingSources().subscribe(() => {
              this.spinner.hide();
            });
          }
        }, error => {
          this.toastr.error(error);
          this.spinner.hide();
        });
      }
    }, error => {
      this.toastr.error(error);
      this.spinner.hide();
    });
  }

  /* Medical Fields() */
  getMedicalFields() {
    return this.http.get(`${environment.baseUrlApi}/context/medical-fields`);
  }

  setMedicalFields(medicalFields) {
    this.sortClassValues(medicalFields);
    this.medicalFields.next(medicalFields);
  }

  /* Organisations */
  getOrganisations() {
    return this.http.get(`${environment.baseUrlApi}/context/organisations`);
  }

  setOrganisations(organisations) {
    this.sortOrganisations(organisations);
    this.organisations.next(organisations);
  }
  
  updateOrganisations() {
    return this.getOrganisations().pipe(
      map((organisations) => {
        this.setOrganisations(organisations);
      })
    );
  }

  sortOrganisations(organisations) {
    const { compare } = Intl.Collator('en-GB');
    organisations.sort((a, b) => { return compare(a.name, b.name); });
  }
  
  addOrganisation(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/organisations`, payload);
  }

  editOrganisation(id, payload) {
    return this.http.put(`${environment.baseUrlApi}/context/organisations/${id}`, payload);
  }

  deleteOrganisation(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/organisations/${id}`, {observe: "response", responseType: 'json'});
  }

  searchOrganisations(term, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1 || item.country?.name?.toLocaleLowerCase().indexOf(term) > -1;
  }

  /**
   * TODO
   * @param orgName 
   * @returns 
   */
  addOrganisationDropdown(orgName) {
    const addOrgModal = this.modalService.open(OrganisationModalComponent, { size: 'lg', backdrop: 'static' });
    addOrgModal.componentInstance.name = orgName;

    return addOrgModal.result.then((result) => {
      if (result === null) {
        this.spinner.hide();
        return new Promise(null);
      }
      
      this.spinner.show();
      return this.addOrganisation(result).pipe(
        mergeMap((o:any) => {
          result.id = o.id;
          return this.updateOrganisations();
        }),
        mergeMap(() => {
          this.spinner.hide();
          return of(result);
        }),
        catchError((err) => {
          this.toastr.error(err, "Error adding organisation", { timeOut: 20000, extendedTimeOut: 20000 });
          return of(null);
        })
      ).toPromise();
    })
    .catch((err) => {
      this.toastr.error(err, "Error adding organisation", { timeOut: 20000, extendedTimeOut: 20000 });
      this.spinner.hide();
      return null;
    });
  }

  /**
   * 
   * @param orgToRemove TODO
   * @param currProjectId 
   */
  deleteOrganisationDropdown(orgToRemove, filter) {
    this.spinner.show();
    // Checking if other projects have this organisation
    this.listService.getReferenceCountByClass("organisation", orgToRemove.id).subscribe((res: any) => {
      let refCount = res.totalCount;
      // Allowing deletion if organisation has already been added and is only referenced once by the calling class
      if (filter) { // !isAdd
        refCount -= 1;
      }

      if (refCount > 0) {
        this.toastr.error(`Failed to delete this organisation as it is used in ${refCount} other objects (projects, studies, etc.)`);
        this.spinner.hide();
      } else {
        // Delete organisation from the DB, then locally if succeeded
        this.deleteOrganisation(orgToRemove.id).subscribe((res: any) => {
          if (res.status !== 204) {
            this.toastr.error('Error when deleting organisation', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
          } else {
            // Updating organisations list
            this.updateOrganisations().subscribe(() => {
              this.spinner.hide();
            });
          }
          this.spinner.hide();
        }, error => {
          this.toastr.error(error);
          this.spinner.hide();
        });
      }
    }, error => {
      this.toastr.error(error);
      this.spinner.hide();
    });
  }

  /* Persons */
  getPersons() {
    return this.http.get(`${environment.baseUrlApi}/context/persons`);
  }

  setPersons(persons) {
    this.sortPersons(persons);
    this.persons.next(persons);
  }

  updatePersons() {
    return this.getPersons().pipe(
      map((persons) => {
        this.setPersons(persons);
      })
    );
  }

  sortPersons(persons) {
    const { compare } = Intl.Collator('en-GB');
    persons.sort((a, b) => { return compare(a.fullName, b.fullName); });
  }

  addPerson(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/persons`, payload);
  }

  editPerson(id, payload) {
    return this.http.put(`${environment.baseUrlApi}/context/persons/${id}`, payload);
  }

  deletePerson(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/persons/${id}`, {observe: "response", responseType: 'json'});
  }

  searchPersons(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.fullName?.toLocaleLowerCase().indexOf(term) > -1
     || item.email?.toLocaleLowerCase().indexOf(term) > -1
     || item.country?.name.toLocaleLowerCase().indexOf(term) > -1 ;
  }

  addPersonDropdown(personName) {
    const addPersonModal = this.modalService.open(PersonModalComponent, { size: 'lg', backdrop: 'static' });
    addPersonModal.componentInstance.fullName = personName;

    return addPersonModal.result.then((result) => {
      if (result === null) {
        return new Promise(null);
      }

      this.spinner.show();
      return this.addPerson(result).pipe(
        mergeMap((p:any) => {
          result.id = p.id;
          return this.updatePersons();
        }),
        mergeMap(() => {
          this.spinner.hide();
          return of(result);
        }),
        catchError((err) => {
          this.toastr.error(err, "Error adding person", { timeOut: 20000, extendedTimeOut: 20000 });
          return of(null);
        })
      ).toPromise();
    })
    .catch((err) => {
      this.toastr.error(err, "Error adding person", { timeOut: 20000, extendedTimeOut: 20000 });
      this.spinner.hide();
      return null;
    });
  }

  deletePersonDropdown(pToRemove, filter) {
    this.spinner.show();
    // Checking if other projects have this person
    this.listService.getReferenceCountByClass("person", pToRemove.id).subscribe((res: any) => {
      let refCount = res.totalCount;
      // Allowing deletion if person has already been added and is only referenced once by the calling class
      if (filter) { // !isAdd
        refCount -= 1;
      }

      if (refCount > 0) {
        this.toastr.error(`Failed to delete this person as it is used in ${refCount} other objects (projects, studies, etc.)`);
        this.spinner.hide();
      } else {
        // Delete person from the DB, then locally if succeeded
        this.deletePerson(pToRemove.id).subscribe((res: any) => {
          if (res.status !== 204) {
            this.toastr.error('Error when deleting person', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
          } else {
            // Updating persons list
            this.updatePersons().subscribe(() => {
              this.spinner.hide();
            });
          }
          this.spinner.hide();
        }, error => {
          this.toastr.error(error);
          this.spinner.hide();
        });
      }
    }, error => {
      this.toastr.error(error);
      this.spinner.hide();
    });
  }

  getPopulations() {
    return this.http.get(`${environment.baseUrlApi}/context/populations`);
  }

  setPopulations(populations) {
    this.sortClassValues(populations);
    this.populations.next(populations);
  }

  getRegulatoryFrameworkDetails() {
    return this.http.get(`${environment.baseUrlApi}/context/regulatory-framework-details`);
  }

  setRegulatoryFrameworkDetails(regulatoryFrameworkDetails) {
    this.sortClassValues(regulatoryFrameworkDetails);
    this.regulatoryFrameworkDetails.next(regulatoryFrameworkDetails);
  }

  /* Services */
  getServices() {
    return this.http.get(`${environment.baseUrlApi}/context/services`);
  }

  setServices(services) {
    this.sortClassValues(services);
    this.services.next(services);
  }
  
  updateServices() {
    return this.getServices().pipe(
      map((services) => {
        this.setServices(services);
      })
    );
  }

  addService(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/services`, payload);
  }
  
  deleteService(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/services/${id}`, {observe: "response", responseType: 'json'});
  }

  addServiceDropdown(value) {
    let service = {"id": "", "value": ""};
    
    this.spinner.show();
    return this.addService({'value': value}).pipe(
      mergeMap((s: any) => {
        service.id = s.id;
        service.value = s.value;
        return this.updateServices();
      }),
      mergeMap(() => {
        this.spinner.hide();
        return of(service);
      }),
      catchError((err) => {
        this.toastr.error(err, "Error adding service", { timeOut: 20000, extendedTimeOut: 20000 });
        return of(null);
      })
    ).toPromise();
  }

  deleteServiceDropdown(sToRemove, filter) {
    this.spinner.show();
    // Checking if other projects have this service
    this.listService.getReferenceCountByClass("service", sToRemove.id).subscribe((res: any) => {
      let refCount = res.totalCount;
      // Allowing deletion if service has already been added and is only referenced once by the calling class
      if (filter) { // !isAdd
        refCount -= 1;
      }

      if (refCount > 0) {
        this.toastr.error(`Failed to delete this service as it is used in ${refCount} other objects (projects, studies, etc.)`);
        this.spinner.hide();
      } else {
        // Delete service from the DB, then locally if succeeded
        this.deleteService(sToRemove.id).subscribe((res: any) => {
          if (res.status !== 204) {
            this.toastr.error('Error when deleting service', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
          } else {
            // Updating services list
            this.updateServices().subscribe(() => {
              this.spinner.hide();
            });
          }
          this.spinner.hide();
        }, error => {
          this.toastr.error(error);
          this.spinner.hide();
        });
      }
    }, error => {
      this.toastr.error(error);
      this.spinner.hide();
    });
  }
}
