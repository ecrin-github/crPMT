import { Component, HostListener, Input, OnInit, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map, mergeMap, reduce, switchMap } from 'rxjs/operators';
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

@Component({
  selector: 'app-upsert-study',
  templateUrl: './upsert-study.component.html',
  styleUrls: ['./upsert-study.component.scss'],
  providers: [ScrollService]
})
export class UpsertStudyComponent implements OnInit {

  @ViewChildren('studyCountries') studyCountryComponents: QueryList<UpsertStudyCountryComponent>;
  @Input() studiesData: Array<StudyInterface>;

  studyStatuses: String[] = ["1_Start-up phase", "2_Running phase_Reg & ethical approvals", "2_Running phase_Follow up", "2_Running phase_Organisation of close-out", 
                              "3_Completion & termination phase", "4_Completed", "5_withdrawn", "6_On hold"];
  regulatoryFrameworks: String[] = ['CTR', 'MDR/IVDR', 'COMBINED', 'OTHER'];
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
  publicTitle: string = '';
  regulatoryFramework: string = '';
  sticky: boolean = false;
  studyType: string = '';
  addType: string = '';
  registryId: number;
  trialId: string;
  countries: [] = [];
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
  studies = [];

  constructor(private statesService: StatesService,
              private fb: UntypedFormBuilder, 
              private router: Router, 
              private studyService: StudyService, 
              private contextService: ContextService,
              private reuseService: ReuseService,
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
    
    this.scrollService.handleScroll([`/studies/${this.id}/view`, `/studies/${this.id}/edit`, `/studies/add`]);

    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
    
    let queryFuncs: Array<Observable<any>> = [];

    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries

    // TODO: if view of single study
    if (this.id && (this.isEdit || this.isView)) {
      queryFuncs.push(this.getStudyById(this.id));
    }

    queryFuncs.push(this.getCountries());

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error.error.title)))));
    });

    combineLatest(obsArr).subscribe(res => {
      this.setCountries(res.pop());
      this.setStudyById(res.pop());

      setTimeout(() => {
        this.spinner.hide();
      });
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
      shortTitle: '',
      project: null,
      title: '',
      status: '',
      pi: '',
      sponsor: '',
      regulatoryFramework: '',
      trialId: '',
      category: '',
      summary: '',
      studyCountries: [],
      alreadyExists: false
    });
  }

  getStudyById(id) {
    return this.studyService.getStudyById(id);
  }

  getCountries() {
    return this.contextService.getCountries();
  }

  setCountries(countries) {
    if (countries) {
      this.countries = countries;
    }
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
        shortTitle: s.shortTitle,
        project: s.project?.id,
        title: s.title,
        status: s.status,
        // pi: s.pi,
        sponsor: s.sponsor,
        regulatoryFramework: s.regulatoryFramework,
        trialId: s.trialId,
        category: s.category,
        summary: s.summary,
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

  // TODO: to be called in multiple places below
  updatePayload(payload) {
    payload.startDate = dateToString(payload.startDate);
    payload.endDate = dateToString(payload.endDate);
  }
  
  onSave(projectId: string): Observable<boolean> {
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.studyForm.value));

    for (const [i, item] of payload.studies.entries()) {
    // payload.studies.forEach(item => {
      this.updatePayload(item);
      if (item.id == '') {  // Add
        
        item.project = projectId;
        let success = this.studyService.addStudy(item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 201) {
              this.toastr.success('Study added successfully');
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

        // TODO: editObs if scObs true (?)
        
        const editObs$ = this.studyService.editStudy(item.id, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              this.toastr.success('Study updated successfully');
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
    
    if (saveObs$.length > 0) {
      return combineLatest(saveObs$).pipe(
        map(arr => arr.reduce((acc: boolean, one: boolean) => {
          return acc && one;
        }, true))
      );
    }

    return of(true);
  }
  
  back(): void {
    this.backService.back();
  }

  onChange() {
    this.publicTitle = this.studyForm.value.displayTitle;
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

  cleanJSON(obj) {
    const keysToDel = ['lastEditedBy', 'deidentType', 'deidentDirect', 'deidentHipaa', 'deidentDates', 'deidentKanon', 'deidentNonarr', 'deidentDetails'];
    for (let key in obj) {
      if (keysToDel.includes(key)) {
        delete obj[key];
      } else if (key === 'person' && obj[key] !== null) { // Removing most user info
        obj[key] = {'userProfile': obj['person']['userProfile'], 
                    'firstName': obj['person']['firstName'],
                    'lastName': obj['person']['lastName'],
                    'email': obj['person']['email']};
      } else if (key === 'id') {  // Deleting all internal IDs
        delete obj[key];
      } else {
        if (key === 'studyFeatures') { // Filtering studyFeatures to match studyType
          obj[key] = obj[key].filter(feature => {
            const cond = feature.featureType?.context?.toLowerCase() === obj.studyType?.name?.toLowerCase();
            if (cond) {
              delete feature['lastEditedBy'];
            }
            return cond;
          });
        }
        if (typeof obj[key] === 'object') {
          if (Array.isArray(obj[key])) {
            // loop through array
            for (let i = 0; i < obj[key].length; i++) {
              this.cleanJSON(obj[key][i]);
            }
          } else {
            // call function recursively for object
            this.cleanJSON(obj[key]);
          }
        }
      }
    }
  }

  jsonExport() {
    this.studyService.getStudyById(this.id).subscribe((res: any) => {
      if (res) {
        const payload = JSON.parse(JSON.stringify(res));
        this.cleanJSON(payload);
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
