import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { ClassValueInterface } from 'src/app/_rms/interfaces/context/class-value.interface';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { CTUInterface } from 'src/app/_rms/interfaces/context/ctu.interface';
import { OrganisationInterface } from 'src/app/_rms/interfaces/context/organisation.interface';
import { PersonInterface } from 'src/app/_rms/interfaces/context/person.interface';
import { StudyInterface } from 'src/app/_rms/interfaces/core/study.interface';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { JsonGeneratorService } from 'src/app/_rms/services/entities/json-generator/json-generator.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { dateToString, getFlagEmoji, getTagBgColor, getTagBorderColor, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { UpsertStudyCountryComponent } from '../../study-country/upsert-study-country/upsert-study-country.component';
import { ProjectService } from 'src/app/_rms/services/entities/project/project.service';

@Component({
  selector: 'app-upsert-study',
  templateUrl: './upsert-study.component.html',
  styleUrls: ['./upsert-study.component.scss'],
  providers: [ScrollService]
})
export class UpsertStudyComponent implements OnInit {

  @ViewChildren('studyCountries') studyCountryComponents: QueryList<UpsertStudyCountryComponent>;
  @Input() studiesData: Array<StudyInterface>;
  @Input() projectId: String;

  // Context
  complexTrialTypes: ClassValueInterface[] = [];
  countries: CountryInterface[] = [];
  ctus: CTUInterface[] = [];
  eucos: PersonInterface[] = [];
  medicalFields: ClassValueInterface[] = [];
  organisations: OrganisationInterface[] = [];
  persons: PersonInterface[] = [];
  populations: ClassValueInterface[] = [];
  regulatoryFrameworkDetails: ClassValueInterface[] = [];
  filteredRegulatoryFrameworkDetails: ClassValueInterface[] = [];
  services: ClassValueInterface[] = [];
  regulatoryFrameworks: String[] = ['CTR', 'MDR/IVDR', 'COMBINED', 'OTHER'];
  studyStatuses: String[] = ["Start-up phase", "Running phase: Regulatory & ethical approvals", "Running phase: Follow up", "Running phase: Organisation of close-out", 
                              "Completion & termination phase", "Completed", "Withdrawn", "On hold"];
  timeUnits: String[] = ["Hours", "Days", "Weeks", "Months"]
  id: string;
  isAdd: boolean = false;
  isEdit: boolean = false;
  isStudyPage: boolean = false;
  isView: boolean = false;
  isAgreementSigned: boolean[] = [];
  isComplexTrial: boolean[] = [];
  isObservational: boolean[] = [];
  hasRegulatoryFrameworkDetails: boolean[] = [];
  projects = [];
  showEdit: boolean = false;
  sticky: boolean = false;
  submitted: boolean = false;
  studyForm: UntypedFormGroup;
  summaryMaxChars: number = 1300;
  summaryRemainingChars: number[] = [];
  studies = [];

  constructor(private fb: UntypedFormBuilder, 
              private router: Router,
              private projectService: ProjectService, 
              private studyService: StudyService, 
              private contextService: ContextService,
              private modalService: NgbModal,
              private scrollService: ScrollService,
              private activatedRoute: ActivatedRoute,
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private jsonGenerator: JsonGeneratorService, 
              private backService: BackService) {
    this.studyForm = this.fb.group({
      studies: this.fb.array([])
    });
  }

  ngOnInit(): void {
    if (this.router.url.includes('studies')) {
      this.id = this.activatedRoute.snapshot.params.id;
      this.isStudyPage = true;
    }

    if (this.isStudyPage) {
      setTimeout(() => {
        this.spinner.show();
      });
    }
    
    // this.scrollService.handleScroll([`/studies/${this.id}/view`, `/studies/${this.id}/edit`, `/studies/add`]);

    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');

    if (this.isStudyPage && this.isAdd) {
      this.addStudy();
    }
    
    let queryFuncs: Array<Observable<any>> = [];

    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries
    if (this.isStudyPage && !this.isAdd) {
      queryFuncs.push(this.getStudyById(this.id));
    }
    if (this.isStudyPage && !this.isView) {
      queryFuncs.push(this.projectService.getProjectList());
    }

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error)))));
    });

    combineLatest(obsArr).subscribe(res => {
      if (this.isStudyPage && !this.isView) {
        this.setProjects(res.pop());
      }
      
      if (this.id && (this.isEdit || this.isView)) {
        this.setStudyById(res.pop());
      }

      setTimeout(() => {
        this.spinner.hide();
      });
    });

    this.contextService.complexTrialTypes.subscribe((complexTrialTypes) => {
      this.complexTrialTypes = complexTrialTypes;
    });
    this.contextService.countries.subscribe((countries) => {
      this.countries = countries;
    });
    this.contextService.ctus.subscribe((ctus) => {
      this.ctus = ctus;
    });
    this.contextService.medicalFields.subscribe((medicalFields) => {
      this.medicalFields = medicalFields;
    });
    this.contextService.organisations.subscribe((organisations) => {
      this.organisations = organisations;
    });
    this.contextService.persons.subscribe((persons) => {
      this.persons = persons;
      if (persons) {
        this.eucos = persons.filter(p => p.isEuco);
      }
    });
    this.contextService.populations.subscribe((populations) => {
      this.populations = populations;
    });
    this.contextService.regulatoryFrameworkDetails.subscribe((regulatoryFrameworkDetails) => {
      this.regulatoryFrameworkDetails = regulatoryFrameworkDetails;
    });
    this.contextService.services.subscribe((services) => {
      this.services = services;
    });

    if (this.isAdd) {
      setTimeout(() => {
        this.spinner.hide();
      });
    }
  }

  get g() { return this.studyForm.get('studies')["controls"]; }

  getControls(i) {
    return this.g[i].controls;
  }

  getStudiesForm(): UntypedFormArray {
    return this.studyForm.get('studies') as UntypedFormArray;
  }

  newStudy(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      shortTitle: null,
      title: null,
      sponsorOrganisation: null,
      leadCtu: null,
      agreementSigned: false,
      agreementSignedDate: null,
      coordinatingInvestigator: null,
      sponsorCountry: null,
      medicalFields: [],
      populations: [],
      rareDiseases: false,
      regulatoryFramework: null,
      regulatoryFrameworkDetails: [],
      complexTrialDesign: false,
      complexTrialType: null,
      trialRegistrationNumber: null,
      summary: null,
      cEuco: null,
      coordinatingCountry: null,
      totalPatientsExpected: null,
      services: [],
      recruitmentPeriod: null,
      recruitmentPeriodUnit: null,
      treatmentDurationPerPatient: null,
      treatmentDurationPerPatientUnit: null,
      treatmentAndFollowUpDurationPerPatient: null,
      treatmentAndFollowUpDurationPerPatientUnit: null,
      firstPatientIn: null,
      lastPatientOut: null,
      status: null,
      project: null,
      studyCountries: [],
    });
  }

  getStudyById(id) {
    return this.studyService.getStudyById(id);
  }

  setStudyById(studyData) {
    if (studyData) {
      this.studies = [studyData];
      this.id = studyData.id;
      this.patchStudyForm();
    }
  }

  setProjects(projects) {
    this.projects = projects;
  }

  deleteStudy($event, i: number) {
    $event.stopPropagation(); // Expands the panel otherwise

    const studyId = this.getStudiesForm().value[i].id;
    if (!studyId) { // Study has been locally added only
      this.getStudiesForm().removeAt(i);
    } else {  // Existing study
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.itemType = "study";

      removeModal.result.then((remove) => {
        if (remove) {
          this.studyService.deleteStudyById(studyId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getStudiesForm().removeAt(i);
              this.toastr.success('Study deleted successfully');
            } else {
              this.toastr.error('Error when deleting study', res.statusText);
            }
          }, error => {
            this.toastr.error(error);
          });
        }
      }, error => {this.toastr.error(error)});
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.studiesData?.currentValue?.length > 0) {
      this.studies = this.studiesData;
      this.patchStudyForm();
    }
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.studies.forEach((s, index) => {
      formArray.push(this.fb.group({
        id: s.id,
        shortTitle: s.shortTitle,
        title: s.title,
        sponsorOrganisation: s.sponsorOrganisation,
        leadCtu: s.leadCtu,
        agreementSigned: s.agreementSigned,
        agreementSignedDate: s.agreementSignedDate ? stringToDate(s.agreementSignedDate) : null,
        coordinatingInvestigator: s.coordinatingInvestigator,
        sponsorCountry: s.sponsorCountry,
        medicalFields: [s.medicalFields],
        populations: [s.populations],
        regulatoryFrameworkDetails: [s.regulatoryFrameworkDetails],
        rareDiseases: s.rareDiseases,
        regulatoryFramework: s.regulatoryFramework,
        complexTrialDesign: s.complexTrialDesign,
        complexTrialType: s.complexTrialType,
        trialRegistrationNumber: s.trialRegistrationNumber,
        summary: s.summary,
        cEuco: s.cEuco,
        coordinatingCountry: s.coordinatingCountry,
        totalPatientsExpected: s.totalPatientsExpected,
        services: [s.services],
        recruitmentPeriod: s.recruitmentPeriod,
        recruitmentPeriodUnit: s.recruitmentPeriodUnit,
        treatmentDurationPerPatient: s.treatmentDurationPerPatient,
        treatmentDurationPerPatientUnit: s.treatmentDurationPerPatientUnit,
        treatmentAndFollowUpDurationPerPatient: s.treatmentAndFollowUpDurationPerPatient,
        treatmentAndFollowUpDurationPerPatientUnit: s.treatmentAndFollowUpDurationPerPatientUnit,
        firstPatientIn: s.firstPatientIn ? stringToDate(s.firstPatientIn) : null,
        lastPatientOut: s.lastPatientOut ? stringToDate(s.lastPatientOut) : null,
        status: s.status,
        project: s.project,
        // Note: unknown why this array needs to be wrapped in another array
        studyCountries: [s.studyCountries]
      }));

      this.summaryRemainingChars[index] = this.summaryMaxChars - s.summary?.length;
    });
    return formArray;
  }

  patchStudyForm() {
    this.studyForm.setControl('studies', this.getFormArray());

    // Setting initial boolean variables to display or not certain fields
    for (let i=0; i < this.g.length; i++) {
      this.onChangeAgreementSigned(i);
      this.onChangeComplexTrialDesign(i);
      this.onChangeRegulatoryFramework(i);
    }
  }

  addStudy() {
    this.getStudiesForm().push(this.newStudy());
  }

  allFormsValid() {
    this.submitted = true;

    if (!this.studyForm.valid) {
      this.toastr.error("Please correct the errors in the studies form");
    }

    return this.studyForm.valid && !this.studyCountryComponents.some(b => !b.isFormValid());
  }

  updatePayload(payload, projectId, i) {
    // Order
    if (!this.isStudyPage) {
      payload.order = i;
    } else if (!payload.id) {  // Add, else no need to change the order
      let maxOrder = -1;
      if (payload.project?.studies?.length > 0) {
        maxOrder = payload.project.studies[payload.project.studies.length-1].order;
      }
      payload.order = maxOrder + 1;
    }

    payload.project = projectId;
    payload.agreementSignedDate = dateToString(payload.agreementSignedDate);
    payload.firstPatientIn = dateToString(payload.firstPatientIn);
    payload.lastPatientOut = dateToString(payload.lastPatientOut);
    
    if (payload.cEuco?.id) {
      payload.cEuco = payload.cEuco.id;
    }
    
    if (payload.complexTrialType?.id) {
      payload.complexTrialType = payload.complexTrialType.id;
    }
    
    if (payload.coordinatingCountry?.id) {
      payload.coordinatingCountry = payload.coordinatingCountry.id;
    }
    
    if (payload.leadCtu?.id) {
      payload.leadCtu = payload.leadCtu.id;
    }
    
    if (payload.medicalFields?.length > 0) {
      for (let i = 0; i < payload.medicalFields.length; i++) {
        if (payload.medicalFields[i]?.id) {
          payload.medicalFields[i] = payload.medicalFields[i].id;
        }
      }
    } else {
      payload.medicalFields = [];
    }
  
    if (payload.coordinatingInvestigator?.id) {
      payload.coordinatingInvestigator = payload.coordinatingInvestigator.id;
    }

    if (payload.populations?.length > 0) {
      for (let i = 0; i < payload.populations.length; i++) {
        if (payload.populations[i]?.id) {
          payload.populations[i] = payload.populations[i].id;
        }
      }
    } else {
      payload.populations = [];
    }
    
    // Removing potentially hidden values from the regulatory framework details field if regulatory framework is not CTR/COMBINED
    if (!this.hasRegulatoryFrameworkDetails[i]) {
      payload.regulatoryFrameworkDetails = [];
    }

    if (payload.regulatoryFrameworkDetails?.length > 0) {
      for (let i = 0; i < payload.regulatoryFrameworkDetails.length; i++) {
        if (payload.regulatoryFrameworkDetails[i]?.id) {
          payload.regulatoryFrameworkDetails[i] = payload.regulatoryFrameworkDetails[i].id;
        }
      }
    } else {
      payload.regulatoryFrameworkDetails = [];
    }
    
    if (payload.services?.length > 0) {
      for (let i = 0; i < payload.services.length; i++) {
        if (payload.services[i]?.id) {
          payload.services[i] = payload.services[i].id;
        }
      }
    } else {
      payload.services = [];
    }
        
    if (payload.sponsorCountry?.id) {
      payload.sponsorCountry = payload.sponsorCountry.id;
    }
        
    if (payload.sponsorOrganisation?.id) {
      payload.sponsorOrganisation = payload.sponsorOrganisation.id;
    }
  }
  
  onSave(projectId: string): Observable<boolean[]> {
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.studyForm.value));

    for (const [i, item] of payload.studies.entries()) {
      this.updatePayload(item, projectId, i);
      if (!item.id) {  // Add
        let success = this.studyService.addStudy(item).pipe(
          mergeMap((res: any) => {
            if (this.isStudyPage && this.isAdd) {  // Need id for redirection is single study add
              this.id = res.id;
            }

            if (res.statusCode === 201) {
              // this.reuseService.notifyComponents();
              return this.studyCountryComponents.get(i).onSave(res.id).pipe(
                mergeMap((success) => {
                  if (success) {
                    return of(true);
                  }
                  return of(false);
                })
              );
            } else {
              this.toastr.error(res.message, "Study adding error", { timeOut: 60000, extendedTimeOut: 60000 });
              return of(false);
            }
          }), catchError(err => {
            this.toastr.error(err.message, 'Error adding study', { timeOut: 60000, extendedTimeOut: 60000 });
            return of(false);
          })
        );
        saveObs$.push(success);
          
      } else {  // Edit
        const scObs$ = this.studyCountryComponents.get(i).onSave(item.id).pipe(
          mergeMap((successArr: boolean[]) => {
            const success: boolean = successArr.every(b => b);
            if (!success) {
              this.toastr.error('Failed to update study countries');
            }
            return of(success);
          })
        );

        saveObs$.push(scObs$);

        // TODO: don't do editObs if scObs$ false?
        
        const editObs$ = this.studyService.editStudy(item.id, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              // this.reuseService.notifyComponents();
              return of(true);
            } else {
              this.toastr.error(res.messages[0]);
              return of(false);
            }
          }), catchError(err => {
            this.toastr.error(err.error.title);
            return of(false);
          })
        );

        saveObs$.push(editObs$);
      }
    }
    
    // if (saveObs$.length > 0) {
    //   return combineLatest(saveObs$).pipe(
    //     map(arr => arr.reduce((acc: boolean, one: boolean) => {
    //       return acc && one;
    //     }, true))
    //   );
    // }

    // return of(true);

    if (saveObs$.length == 0) {
      saveObs$.push(of(true));
    }

    return combineLatest(saveObs$);
  }

  onSaveStudy() {
    this.spinner.show();

    if (this.allFormsValid()) {
      const projectId = this.studyForm.value?.studies[0]?.project?.id;
      if (projectId) {
        this.onSave(projectId).subscribe((success) => {
          this.spinner.hide();
          if (success) {
            this.toastr.success("Data saved successfully");
            this.router.navigate([`/studies/${this.id}/view`]);
          }
        });
      } else {
        this.spinner.hide();
        this.toastr.error("Couldn't get project ID from study");
      }
    }
  }
  
  back(): void {
    this.backService.back();
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }

  onChangeAgreementSigned(i) {
    if (this.studyForm.value?.studies[i].agreementSigned) {
      this.isAgreementSigned[i] = true;
    } else {
      this.isAgreementSigned[i] = false;
    }
  }

  onChangeComplexTrialDesign(i) {
    if (this.studyForm.value?.studies[i].complexTrialDesign) {
      this.isComplexTrial[i] = true;
    } else {
      this.isComplexTrial[i] = false;
    }
  }
  
  onChangeRegulatoryFramework(i) {
    const regFramework = this.studyForm.value?.studies[i].regulatoryFramework?.toLowerCase();
    if (regFramework?.localeCompare("other") == 0) {
      this.isObservational[i] = true;
    } else {
      this.isObservational[i] = false;
    }

    if (regFramework?.localeCompare("ctr") == 0 || regFramework?.localeCompare("combined") == 0) {
      if (regFramework?.localeCompare("combined") == 0) { // Filtering out 1 value for "combined"
        if (this.regulatoryFrameworkDetails) {
          this.filteredRegulatoryFrameworkDetails = this.regulatoryFrameworkDetails.filter(r => r?.value?.toLowerCase()?.localeCompare("low interventional trial") != 0);
        }
      } else {
        this.filteredRegulatoryFrameworkDetails = this.regulatoryFrameworkDetails;
      }
      this.hasRegulatoryFrameworkDetails[i] = true;
    } else {
      this.hasRegulatoryFrameworkDetails[i] = false;
    }
  }
  
  searchClassValues = (term: string, item) => {
    return this.contextService.searchClassValues(term, item);
  }

  searchCTUs = (term: string, item) => {
    return this.contextService.searchCTUs(term, item);
  }

  addComplexTrialType = (type) => {
    return this.contextService.addComplexTrialTypeDropdown(type);
  }

  deleteComplexTrialType($event, cToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (cToRemove.id == -1) { // Created locally by user
      this.complexTrialTypes = this.complexTrialTypes.filter(c => !(c.id == cToRemove.id && c.value == cToRemove.value));
    } else {  // Already existing
      this.contextService.deleteComplexTrialTypeDropdown(cToRemove, !this.isAdd);
    }
  }

  searchCountries = (term: string, item) => {
    return this.contextService.searchCountries(term, item);
  }

  addCTU = (ctuName) => {
    return this.contextService.addCTUDropdown(ctuName);
  }

  deleteCTU($event, ctuToRemove) {
    $event.stopPropagation();

    if (ctuToRemove.id == -1) { // Created locally by user
      this.ctus = this.ctus.filter(o => !(o.id == ctuToRemove.id && o.name == ctuToRemove.name));
    } else {  // Already existing
      this.contextService.deleteCTUDropdown(ctuToRemove, !this.isAdd);
    }
  }

  // Necessary to write them as arrow functions
  searchOrganisations = (term: string, item) => {
    return this.contextService.searchOrganisations(term, item);
  }

  addOrganisation = (orgName) => {
    return this.contextService.addOrganisationDropdown(orgName);
  }

  deleteOrganisation($event, oToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (oToRemove.id == -1) { // Created locally by user
      this.organisations = this.organisations.filter(o => !(o.id == oToRemove.id && o.name == oToRemove.name));
    } else {  // Already existing
      this.contextService.deleteOrganisationDropdown(oToRemove, !this.isAdd);
    }
  }

  // Necessary to write them as arrow functions
  searchPersons = (term: string, item) => {
    return this.contextService.searchPersons(term, item);
  }

  addPerson = (person) => {
    return this.contextService.addPersonDropdown(person);
  }

  deletePerson($event, pToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (pToRemove.id == -1) {  // Created locally by user
      this.persons = this.persons.filter(s => !(s.id == pToRemove.id && s.fullName == pToRemove.fullName));
    } else {  // Already existing
      this.contextService.deletePersonDropdown(pToRemove, !this.isAdd);
    }
  }

  searchProjects(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.shortName?.toLocaleLowerCase().indexOf(term) > -1 || item.fullName?.toLocaleLowerCase().indexOf(term) > -1;
  }

  addService = (value) => {
    return this.contextService.addServiceDropdown(value);
  }

  deleteService($event, sToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (sToRemove.id == -1) {  // Created locally by user
      this.services = this.services.filter(s => !(s.id == sToRemove.id && s.value == sToRemove.value));
    } else {  // Already existing
      this.contextService.deleteServiceDropdown(sToRemove, !this.isAdd);
    }
  }

  getTagBorderColor(text) {
    return getTagBorderColor(text);
  }

  getTagBgColor(text) {
    return getTagBgColor(text);
  }

  dateToString(date) {
    return dateToString(date);
  }

  getCountrySitesString(sc) {
    let count = 0;
    for (const sctu of sc.studyCtus) {
      if (sctu.centres) {
        count += sctu.centres.length;
      }
    }
    return count + " site" + (count == 1 ? '' : 's');
  }

  getCountryFlagFromIso2(iso2) {
    return getFlagEmoji(iso2);
  }

  changeRemainingChars($event, i) {
    this.summaryRemainingChars[i] = this.summaryMaxChars - $event.target.value?.length;
  }

  print() {
    this.studyService.getStudyById(this.id).subscribe((res: any) => {
      if (res) {
        const payload = JSON.parse(JSON.stringify(res));
        payload.studyFeatures = payload.studyFeatures.filter((item: any) => item.featureType?.context?.toLowerCase() === payload.studyType?.name?.toLowerCase());
        // this.pdfGenerator.studyPdfGenerator(payload);
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }

  jsonExport() {
    this.studyService.getStudyById(this.id).subscribe((res: any) => {
      if (res) {
        const payload = JSON.parse(JSON.stringify(res));
        this.jsonGenerator.jsonGenerator(payload, 'study');
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }

  gotoTop() {
    window.scroll({ 
      top: 0, 
      left: 0, 
      behavior: 'smooth' 
    });
  }

  ngOnDestroy() {
    this.scrollService.unsubscribeScroll();
  }
}
