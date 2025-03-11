import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, mergeMap } from 'rxjs/operators';
import { OrganisationInterface } from 'src/app/_rms/interfaces/organisation/organisation.interface';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { JsonGeneratorService } from 'src/app/_rms/services/entities/json-generator/json-generator.service';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { PdfGeneratorService } from 'src/app/_rms/services/entities/pdf-generator/pdf-generator.service';
import { ProjectService } from 'src/app/_rms/services/entities/project/project.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { ProjectInterface } from 'src/app/_rms/interfaces/project/project.interface';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { UpsertStudyComponent } from '../../../study/upsert/upsert-study/upsert-study.component';

@Component({
  selector: 'app-upsert-project',
  templateUrl: './upsert-project.component.html',
  styleUrls: ['./upsert-project.component.scss'],
  providers: [ScrollService]
})
export class UpsertProjectComponent implements OnInit {

  @ViewChild(UpsertStudyComponent) study: UpsertStudyComponent;

  public isCollapsed: boolean = false;
  projectForm: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  projectTypes: [] = [];
  projectStatuses: [] = [];
  genderEligibility: [] = [];
  timeUnits: [] =[];
  trialRegistries: any;
  subscription: Subscription = new Subscription();
  submitted: boolean = false;
  id: string;
  sdSid: string;
  organisationName: string;
  organisations: Array<OrganisationInterface>;
  projectData: ProjectInterface;
  projectFull: any;
  count = 0;
  publicTitle: string = '';
  monthValues = [{id:'1', name:'January'}, {id:'2', name:'February'}, {id:'3', name: 'March'}, {id:'4', name: 'April'}, {id:'5', name: 'May'}, {id:'6', name: 'June'}, {id:'7', name: 'July'}, {id:'8', name: 'August'}, {id:'9', name: 'September'}, {id:'10', name: 'October'}, {id:'11', name:'November'}, {id:'12', name: 'December'}];
  sticky: boolean = false;
  projectType: string = '';
  addType: string = '';
  registryId: number;
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
              private projectService: ProjectService, 
              private reuseService: ReuseService,
              private scrollService: ScrollService,
              private activatedRoute: ActivatedRoute,
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private jsonGenerator: JsonGeneratorService, 
              private backService: BackService) {
    this.projectForm = this.fb.group({
      shortName: '',
      name: ['', Validators.required],
      gaNumber: '',
      url: '',
      startDate: null,
      endDate: null,
      studyData: null,
      reportingPeriods: []
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.spinner.show();
    });

    this.id = this.activatedRoute.snapshot.params.id;
    
    this.scrollService.handleScroll([`/projects/${this.id}/view`, `/projects/${this.id}/edit`, `/projects/add`]);

    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
    
    let queryFuncs: Array<Observable<any>> = [];

    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries

    // Need to pipe both getProject and getAssociatedObjects because they need to be completed in order
    if (this.isEdit || this.isView) {
      queryFuncs.push(this.getProjectById(this.id));
    }

    // Queries required even for view because of pdf/json exports
    // queryFuncs.push(this.getProjectTypes());

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error.error.title)))));
    });

    combineLatest(obsArr).subscribe(res => {
      this.setProjectById(res.pop());

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

  get g() { return this.projectForm.controls; }

  getProjectById(id) {
    return this.projectService.getProjectById(id);
  }

  setProjectById(projectData) {
    if (projectData) {
      this.projectData = projectData;
      // TODO: ?
      this.projectData.startDate = dateToString(stringToDate(this.projectData.startDate));
      this.projectData.endDate = dateToString(stringToDate(this.projectData.endDate));
      this.id = projectData.id;
      this.patchProjectForm();
    }
  }

  patchProjectForm() {
    this.projectForm.patchValue({
      shortName: this.projectData.shortName,
      name: this.projectData.name,
      gaNumber: this.projectData.gaNumber,
      url: this.projectData.url,
      startDate: this.projectData.startDate ? stringToDate(this.projectData.startDate) : null,
      endDate: this.projectData.endDate ? stringToDate(this.projectData.endDate) : null,
      studyData: this.projectData.studies,
    });
  }

  onSave() {
    this.spinner.show();
    if (localStorage.getItem('updateProjectList')) {
      localStorage.removeItem('updateProjectList');
    }
    this.submitted = true;
    if (this.projectForm.valid) {
      const payload = JSON.parse(JSON.stringify(this.projectForm.value));
      payload.startDate = dateToString(payload.startDate);
      payload.endDate = dateToString(payload.endDate);

      if (this.isEdit) {
        this.projectService.editProject(this.id, payload).subscribe((res: any) => {
          if (res.statusCode === 200) {
            this.toastr.success('Project updated successfully');
            localStorage.setItem('updateProjectList', 'true');
            this.reuseService.notifyComponents();
            this.study.onSave(this.id).subscribe((success) => {
              if (success) {
                this.toastr.success('Study updated successfully');
                this.router.navigate([`/projects/${this.id}/view`]);
              }
              this.spinner.hide();
            });
          } else {
            this.toastr.error(res.messages[0]);
            this.spinner.hide();
          }
        }, error => {
          this.toastr.error(error.error.title);
          this.spinner.hide();
        })
      } else {  // this.isAdd
        this.projectService.addProject(payload).subscribe((res: any) => {
          if (res.statusCode === 201) {
            this.toastr.success('Project added successfully');
            localStorage.setItem('updateProjectList', 'true');
            // TODO
            this.reuseService.notifyComponents();
            this.id = res.id;
            this.study.onSave(this.id).subscribe((success) => {
              if (success) {
                this.toastr.success('Study added successfully');
                this.router.navigate([`/projects/${res.id}/view`]);
              }
              this.spinner.hide();
            });
          } else {
            this.toastr.error(res.message, "Project adding error");
            this.spinner.hide();
          }
        }, error => {
          this.toastr.error(error.message, 'Error adding project');
          this.spinner.hide();
        })
      }
    } else {
      this.spinner.hide();
      this.gotoTop();
      this.toastr.error("Please correct the errors in the form's fields.");
    }
    this.count = 0;
  }

  back(): void {
    this.backService.back();
  }

  onChange() {
    this.publicTitle = this.projectForm.value.displayTitle;
  }

  print() {
    this.projectService.getProjectById(this.id).subscribe((res: any) => {
      if (res) {
        const payload = JSON.parse(JSON.stringify(res));
        payload.projectFeatures = payload.projectFeatures.filter((item: any) => item.featureType?.context?.toLowerCase() === payload.projectType?.name?.toLowerCase());
        // this.pdfGenerator.projectPdfGenerator(payload);
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
        if (key === 'projectFeatures') { // Filtering projectFeatures to match projectType
          obj[key] = obj[key].filter(feature => {
            const cond = feature.featureType?.context?.toLowerCase() === obj.projectType?.name?.toLowerCase();
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
    this.projectService.getProjectById(this.id).subscribe((res: any) => {
      if (res) {
        const payload = JSON.parse(JSON.stringify(res));
        this.cleanJSON(payload);
        this.jsonGenerator.jsonGenerator(payload, 'project');
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
