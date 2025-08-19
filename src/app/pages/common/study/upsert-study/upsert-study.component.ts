import { Component, HostListener, Input, OnInit, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map, mergeMap, reduce, switchMap, take } from 'rxjs/operators';
import { OrganisationInterface } from 'src/app/_rms/interfaces/organisation/organisation.interface';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { JsonGeneratorService } from 'src/app/_rms/services/entities/json-generator/json-generator.service';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { PdfGeneratorService } from 'src/app/_rms/services/entities/pdf-generator/pdf-generator.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { StudyInterface } from 'src/app/_rms/interfaces/study/study.interface';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { UpsertStudyCountryComponent } from '../../study-country/upsert-study-country/upsert-study-country.component';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { PersonInterface } from 'src/app/_rms/interfaces/person.interface';
import { PersonModalComponent } from '../../person-modal/person-modal.component';
import { ProjectInterface } from 'src/app/_rms/interfaces/project/project.interface';

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

  studyStatuses: String[] = ["Start-up phase", "Running phase: Regulatory & ethical approvals", "Running phase: Follow up", "Running phase: Organisation of close-out", 
                              "Completion & termination phase", "Completed", "Withdrawn", "On hold"];
  regulatoryFrameworks: String[] = ['CTR', 'MDR/IVDR', 'COMBINED', 'OTHER'];
  populations: String[] = ["Adult", "Paediatric", "Adult & Paediatric"];
  public isCollapsed: boolean = false;
  studyForm: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  studyTypes: [] = [];
  genderEligibility: [] = [];
  timeUnits: [] =[];
  trialRegistries: any;
  subscription: Subscription = new Subscription();
  submitted: boolean = false;
  id: string;
  organisationName: string;
  organisations: Array<OrganisationInterface>;
  studyFull: any;
  regulatoryFramework: string = '';
  sticky: boolean = false;
  studyType: string = '';
  addType: string = '';
  registryId: number;
  trialId: string;
  identifierTypes: [] = [];
  titleTypes: [] = [];
  featureTypes: [] = [];
  featureValuesAll: [] = [];
  topicTypes: [] = [];
  controlledTerminology: [] = [];
  relationshipTypes: [] = [];
  isBrowsing: boolean = false;
  isManager: any;
  orgId: string;
  associatedObjects: any;
  showEdit: boolean = false;
  isObservational: boolean = false;
  studies = [];
  persons: PersonInterface[] = [];

  constructor(private statesService: StatesService,
              private fb: UntypedFormBuilder, 
              private router: Router, 
              private studyService: StudyService, 
              private contextService: ContextService,
              private reuseService: ReuseService,
              private listService: ListService,
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
    setTimeout(() => {
      this.spinner.show();
    });

    if (this.router.url.includes('studies')) {
      this.id = this.activatedRoute.snapshot.params.id;
    }
    
    // this.scrollService.handleScroll([`/studies/${this.id}/view`, `/studies/${this.id}/edit`, `/studies/add`]);

    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
    
    let queryFuncs: Array<Observable<any>> = [];

    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries

    if (this.id && (this.isEdit || this.isView)) {
      queryFuncs.push(this.getStudyById(this.id));
    }

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error.error.title)))));
    });

    combineLatest(obsArr).subscribe(res => {
      this.setStudyById(res.pop());

      setTimeout(() => {
        this.spinner.hide();
      });
    });

    this.contextService.persons.subscribe((persons) => {
      this.persons = persons;
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
      id: '',
      category: '',
      firstPatientIn: null,
      lastPatientOut: null,
      population: '',
      recruitmentEnd: null,
      recruitmentStart: null,
      regulatoryFramework: '',
      shortTitle: '',
      sponsor: '',
      summary: '',
      status: '',
      title: '',
      treatmentAndFollowUpDurationPerPatient: '',
      treatmentPeriodPerPatient: '',
      trialId: '',
      trialRegistration: '',
      pi: null,
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

  removeStudy(i: number) {
    const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
    removeModal.componentInstance.itemType = "study";

    removeModal.result.then((remove) => {
      if (remove) {
        const studyId = this.getStudiesForm().value[i].id;
        if (!studyId) { // Study has been locally added only
          this.getStudiesForm().removeAt(i);
        } else {  // Existing study
          this.studyService.deleteStudyById(studyId).subscribe((res: any) => {
            console.log(res);
            if (res.status === 204) {
              this.getStudiesForm().removeAt(i);
              this.toastr.success('Study deleted successfully');
            } else {
              this.toastr.error('Error when deleting study', res.statusText);
            }
          }, error => {
            this.toastr.error(error.error.title);
          })
        }
      }
    }, error => {});
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.studiesData?.currentValue?.length > 0) {
      this.studies = this.studiesData;
      this.patchStudyForm();
    }
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.studies.forEach(s => {
      formArray.push(this.fb.group({
        id: s.id,
        category: s.category,
        firstPatientIn: s.firstPatientIn ? stringToDate(s.firstPatientIn) : null,
        lastPatientOut: s.lastPatientOut ? stringToDate(s.lastPatientOut) : null,
        population: s.population,
        recruitmentEnd: s.recruitmentEnd ? stringToDate(s.recruitmentEnd) : null,
        recruitmentStart: s.recruitmentStart ? stringToDate(s.recruitmentStart) : null,
        regulatoryFramework: s.regulatoryFramework,
        shortTitle: s.shortTitle,
        sponsor: s.sponsor,
        status: s.status,
        summary: s.summary,
        title: s.title,
        treatmentAndFollowUpDurationPerPatient: s.treatmentAndFollowUpDurationPerPatient,
        treatmentPeriodPerPatient: s.treatmentPeriodPerPatient,
        trialId: s.trialId,
        trialRegistration: s.trialRegistration,
        pi: s.pi,
        project: s.project?.id,
        // Note: unknown why this array needs to be wrapped in another array
        studyCountries: [s.studyCountries]
      }))
    });
    return formArray;
  }

  patchStudyForm() {
    this.studyForm.setControl('studies', this.getFormArray());
  }

  addStudy() {
    this.getStudiesForm().push(this.newStudy());
  }

  allFormsValid() {
    this.submitted = true;
    return this.studyForm.valid && !this.studyCountryComponents.some(b => !b.formValid());
  }

  updatePayload(payload, projectId, i) {
    payload.project = projectId;
    payload.firstPatientIn = dateToString(payload.firstPatientIn);
    payload.lastPatientOut = dateToString(payload.lastPatientOut);
    payload.recruitmentStart = dateToString(payload.recruitmentStart);
    payload.recruitmentEnd = dateToString(payload.recruitmentEnd);
    if (payload.pi?.id) {
      payload.pi = payload.pi.id;
    }
    payload.order = i;
  }
  
  onSave(projectId: string): Observable<boolean[]> {
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.studyForm.value));

    for (const [i, item] of payload.studies.entries()) {
      this.updatePayload(item, projectId, i);
      if (!item.id) {  // Add
        let success = this.studyService.addStudy(item).pipe(
          mergeMap((res: any) => {
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
    const projectId = this.studyForm.value?.studies[0]?.project;
    if (projectId) {
      this.onSave(projectId).subscribe((success) => {
        if (success) {
          this.toastr.success("Data saved successfully");
          this.router.navigate([`/studies/${this.id}/view`]);
        }
      });
    } else {
      this.toastr.error("Couldn't get project ID from study");
    }

    this.spinner.hide();
  }
  
  back(): void {
    this.backService.back();
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }

  // Necessary to write it as an arrow function
  addPerson = (person) => {
    const addPersonModal = this.modalService.open(PersonModalComponent, { size: 'lg', backdrop: 'static' });
    addPersonModal.componentInstance.fullName = person;

    return addPersonModal.result.then((result) => {
      this.spinner.show();
      if (result === null) {
        return new Promise(null);
      }

      return this.contextService.addPerson(result).pipe(
        mergeMap((p:any) => {
          result.id = p.id;
          return this.contextService.updatePersons();
        }),
        mergeMap(() => {
          this.spinner.hide();
          return of(result);
        }),
        catchError((err) => {
          this.toastr.error(err, "Error adding person", { timeOut: 20000, extendedTimeOut: 20000 });
          this.spinner.hide();
          return of(null);
        })
      ).toPromise();
    })
    .catch((err) => {
      this.spinner.hide();
      this.toastr.error(err, "Error adding person", { timeOut: 20000, extendedTimeOut: 20000 });
      return null;
    });
  }

  searchPersons(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.fullName?.toLocaleLowerCase().indexOf(term) > -1 || item.email?.toLocaleLowerCase().indexOf(term) > -1;
  }

  onChangeRegulatoryFramework() {
    if (this.studyForm.value?.studies[0].regulatoryFramework?.toLowerCase() == "other" ) {
      this.isObservational = true;
    } else {
      this.isObservational = false;
    }
  }

  // TODO: refactor spinner hide
  deletePerson($event, pToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (pToRemove.id == -1) {  // Created locally by user
      this.persons = this.persons.filter(s => !(s.id == pToRemove.id && s.fullName == pToRemove.fullName));
    } else {  // Already existing
      this.spinner.show();
      // Checking if other projects have this service
      this.listService.getProjectsByPerson(pToRemove.id).subscribe((res: []) => {
        // Allowing deletion on current project, even if person is selected in another field/component (too complicated otherwise)
        let resWithoutCurrent: ProjectInterface[] = res;
        if (!this.isAdd) {
          resWithoutCurrent = res.filter((project: ProjectInterface) => project.id != this.projectId);
        }

        if (resWithoutCurrent.length > 0) {
          this.toastr.error(`Failed to delete this person as it is used in project${(resWithoutCurrent.length > 1) ? 's' : ''}:\
           ${resWithoutCurrent.map(proj => proj.shortName).join(", ")}`, "Error deleting person", { timeOut: 20000, extendedTimeOut: 20000 });
           this.spinner.hide();
        } else {
          // Delete person from the DB, then locally if succeeded
          this.contextService.deletePerson(pToRemove.id).subscribe((res: any) => {
            if (res.status !== 204) {
              this.toastr.error('Error when deleting person', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
              this.spinner.hide();
            } else {
              // Updating persons list
              this.contextService.updatePersons().subscribe(() => {
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
  }

  dateToString(date) {
    return dateToString(date);
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
    this.subscription.unsubscribe();
  }
}
