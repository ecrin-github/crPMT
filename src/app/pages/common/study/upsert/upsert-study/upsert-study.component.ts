import { Component, HostListener, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, mergeMap, reduce, switchMap } from 'rxjs/operators';
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
import { StudyCountryComponent } from '../study-country/study-country.component';

@Component({
  selector: 'app-upsert-study',
  templateUrl: './upsert-study.component.html',
  styleUrls: ['./upsert-study.component.scss'],
  providers: [ScrollService]
})
export class UpsertStudyComponent implements OnInit {

  @ViewChild(StudyCountryComponent) studyCountry: StudyCountryComponent;
  @Input() studies: Array<StudyInterface>;

  public isCollapsed: boolean = false;
  studyForm: UntypedFormGroup;
  // TODO: temp
  studyData: StudyInterface;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  studyTypes: [] = [];
  studyStatuses: [] = [];
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
  regulatoryFrameworks = ['CTR', 'MDR/IVDR', 'COMBINED', 'OTHER'];
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
  pageSize: Number = 10000;
  showEdit: boolean = false;

  constructor(private statesService: StatesService,
              private fb: UntypedFormBuilder, 
              private router: Router, 
              private studyService: StudyService, 
              private reuseService: ReuseService,
              private scrollService: ScrollService,
              private activatedRoute: ActivatedRoute,
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private jsonGenerator: JsonGeneratorService, 
              private backService: BackService) {
    this.studyForm = this.fb.group({
      shortTitle: '',
      title: '',
      status: '',
      pi: '',
      sponsor: '',
      regulatoryFramework: '',
      trialId: '',
      category: '',
      summary: '',
      studyCountries: [],
      project: null
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

    // TODO: useless
    if (this.id && (this.isEdit || this.isView)) {
      queryFuncs.push(this.getStudyById(this.id));
    }

    // Queries required even for view because of pdf/json exports
    // queryFuncs.push(this.getStudyTypes());

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

    if (this.isAdd) {
      setTimeout(() => {
        this.spinner.hide();
      });
    }
  }

  get g() { return this.studyForm.controls; }

  getStudyById(id) {
    return this.studyService.getStudyById(id);
  }

  setStudyById(studyData) {
    if (studyData) {
      this.studyData = studyData;
      this.id = studyData.id;
      this.patchStudyForm();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.studies?.currentValue?.length > 0) {
      this.studyData = this.studies[0];
      this.id = this.studyData.id;
      this.patchStudyForm();
    }
  }

  patchStudyForm() {
    this.studyForm.patchValue({
      shortTitle: this.studyData.shortTitle,
      project: this.studyData.project?.id,
      title: this.studyData.title,
      status: this.studyData.status,
      // pi: this.studyData.pi,
      sponsor: this.studyData.sponsor,
      regulatoryFramework: this.studyData.regulatoryFramework,
      trialId: this.studyData.trialId,
      category: this.studyData.category,
      summary: this.studyData.summary,
      countries: this.studyData.studyCountries
    });
  }

  // onSave() {
  //   this.spinner.show();
  //   if (localStorage.getItem('updateStudyList')) {
  //     localStorage.removeItem('updateStudyList');
  //   }
  //   this.submitted = true;
  //   if (this.studyForm.valid) {
  //     const payload = JSON.parse(JSON.stringify(this.studyForm.value));
  //     payload.startDate = dateToString(payload.startDate);
  //     payload.endDate = dateToString(payload.endDate);

  //     if (this.isEdit) {
  //       this.studyService.editStudy(this.id, payload).subscribe((res: any) => {
  //         if (res.statusCode === 200) {
  //           this.toastr.success('Study updated successfully');
  //           localStorage.setItem('updateStudyList', 'true');
  //           this.reuseService.notifyComponents();
  //           this.spinner.hide();
  //           this.router.navigate([`/studies/${this.id}/view`]);
  //         } else {
  //           this.toastr.error(res.messages[0]);
  //           this.spinner.hide();
  //         }
  //       }, error => {
  //         this.spinner.hide();
  //         this.toastr.error(error.error.title);
  //       })
  //     } else {  // this.isAdd
  //       this.studyService.addStudy(payload).pipe(
  //         finalize(() => this.spinner.hide())
  //       ).subscribe((res: any) => {
  //         if (res.statusCode === 201) {
  //           this.toastr.success('Study added successfully');
  //           localStorage.setItem('updateStudyList', 'true');
  //           this.reuseService.notifyComponents();
  //           if (res.sdSid) {
  //             this.router.navigate([`/studies/${res.id}/view`]);
  //           } else {
  //             this.back();
  //           }
  //         } else {
  //           this.toastr.error(res.message, "Study adding error");
  //         }
  //       }, error => {
  //         this.toastr.error(error.message, 'Error adding study');
  //       })
  //     }
  //   } else {
  //     this.spinner.hide();
  //     this.gotoTop();
  //     this.toastr.error("Please correct the errors in the form's fields.");
  //   }
  //   this.count = 0;
  //   this.spinner.hide()
  // }
  
  onSave(projectId: string): Observable<boolean> {
    let success: Observable<boolean> = of(false);
    if (localStorage.getItem('updateStudyList')) {
      localStorage.removeItem('updateStudyList');
    }
    this.submitted = true;
    if (this.studyForm.valid) {
      const payload = JSON.parse(JSON.stringify(this.studyForm.value));
      payload.startDate = dateToString(payload.startDate);
      payload.endDate = dateToString(payload.endDate);

      // TODO: refactor
      if (this.isEdit) {
        const scObs$ = this.studyCountry.onSave(this.id).pipe(
          mergeMap((success) => {
            if (success) {
              this.toastr.success('Study countries updated successfully');
              return of(true);
            }
            return of(false);
          })
        );

        const editObs$ = this.studyService.editStudy(this.id, payload).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              // this.toastr.success('Study updated successfully');
              localStorage.setItem('updateStudyList', 'true');
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

        success = combineLatest([scObs$, editObs$]).pipe(
          switchMap(([scRes, editRes]) => {
            return of(scRes && editRes);
          })
        );

      } else {  // this.isAdd
        payload.project = projectId;
        success = this.studyService.addStudy(payload).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 201) {
              // this.toastr.success('Study added successfully');
              localStorage.setItem('updateStudyList', 'true');
              // this.reuseService.notifyComponents();
              return this.studyCountry.onSave(res.id).pipe(
                mergeMap((success) => {
                  if (success) {
                    this.toastr.success('Study countries updated successfully');
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
      }
    } else {
      // this.gotoTop();
      this.toastr.error("Please correct the errors in the form.");
    }

    return success;
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
