import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map, mergeMap } from 'rxjs/operators';
import { OrganisationInterface } from 'src/app/_rms/interfaces/organisation/organisation.interface';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { JsonGeneratorService } from 'src/app/_rms/services/entities/json-generator/json-generator.service';
import { PdfGeneratorService } from 'src/app/_rms/services/entities/pdf-generator/pdf-generator.service';
import { ProjectService } from 'src/app/_rms/services/entities/project/project.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { ProjectInterface } from 'src/app/_rms/interfaces/project/project.interface';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { UpsertStudyComponent } from '../../study/upsert-study/upsert-study.component';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { FundingSourceInterface } from 'src/app/_rms/interfaces/context/funding-source.interface';
import { ServiceInterface } from 'src/app/_rms/interfaces/context/service.interface';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';

@Component({
  selector: 'app-upsert-project',
  templateUrl: './upsert-project.component.html',
  styleUrls: ['./upsert-project.component.scss'],
  providers: [ScrollService]
})
export class UpsertProjectComponent implements OnInit {

  @ViewChild(UpsertStudyComponent) studyComponent: UpsertStudyComponent;

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
  fundingSources: FundingSourceInterface[] = [];
  services: ServiceInterface[] = [];
  isBrowsing: boolean = false;
  isManager: any;
  orgId: string;
  associatedObjects: any;
  pageSize: Number = 10000;
  showEdit: boolean = false;

  constructor(private contextService: ContextService,
              private fb: UntypedFormBuilder, 
              private router: Router, 
              private projectService: ProjectService, 
              private listService: ListService,
              private reuseService: ReuseService,
              private scrollService: ScrollService,
              private activatedRoute: ActivatedRoute,
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private jsonGenerator: JsonGeneratorService, 
              private backService: BackService) {
    this.projectForm = this.fb.group({
      shortName: ['', Validators.required],
      name: '',
      gaNumber: '',
      url: '',
      startDate: null,
      endDate: null,
      studyData: null,
      reportingPeriods: [],
      fundingSources: [],
      services: []
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

    this.contextService.fundingSources.subscribe((fundingSources) => {
      this.fundingSources = fundingSources;
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
      fundingSources: this.projectData.fundingSources,
      services: this.projectData.services
    });

    this.onChangeFundingSources();
  }

  allFormsValid() {
    this.submitted = true;
    return this.projectForm.valid && this.studyComponent.allFormsValid();
  }

  onSave() {
    this.spinner.show();
    if (localStorage.getItem('updateProjectList')) {
      localStorage.removeItem('updateProjectList');
    }

    if (this.allFormsValid()) {
      const payload = JSON.parse(JSON.stringify(this.projectForm.value));
      payload.startDate = dateToString(payload.startDate);
      payload.endDate = dateToString(payload.endDate);

      let fsObs$: Array<Observable<boolean>> = [];
      let saveObs$: Array<Observable<boolean>> = [];

      // Adding any new funding source that may have been created, and change all funding source to their IDs (instead of object)
      if (payload.fundingSources) {
        for (let i = 0; i < payload.fundingSources.length; i++) {
          if (payload.fundingSources[i].id == -1) {
            const success = this.contextService.addFundingSource({'name': payload.fundingSources[i].name}).pipe(
              mergeMap((res: any) => {
                if (res.statusCode === 201) {
                  payload.fundingSources[i] = res.id;
                  return of(true);
                } else {
                  this.toastr.error(res.message, "Error adding funding source", { timeOut: 60000, extendedTimeOut: 60000 });
                  return of(false);
                }
              }), catchError(err => {
                this.toastr.error(err.message, 'Error adding funding source', { timeOut: 60000, extendedTimeOut: 60000 });
                return of(false);
              })
            );
  
            fsObs$.push(success);
          } else {
            payload.fundingSources[i] = payload.fundingSources[i].id;
          }
        }
      } else {
        payload.fundingSources = [];
      }

      if (fsObs$.length == 0) {
        fsObs$.push(of(true));
      }

      if (payload.services) {

      } else {
        payload.services = [];
      }

      // Saving project and "child" components
      if (this.isEdit) {
        const success = this.projectService.editProject(this.id, payload).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              // this.reuseService.notifyComponents();
              return this.studyComponent.onSave(res.id).pipe(
                mergeMap((success) => {
                  if (success) {
                    this.toastr.success('Data updated successfully');
                    return of(true);
                  }
                  return of(false);
                })
              );

            } else {
              this.toastr.error(res.message, "Error editing project", { timeOut: 60000, extendedTimeOut: 60000 });
              return of(false);
            }
          }), catchError(err => {
            this.toastr.error(err.message, 'Error editing project', { timeOut: 60000, extendedTimeOut: 60000 });
            return of(false);
          })
        );

        saveObs$.push(success);
        
      } else {  // this.isAdd
        const success = this.projectService.addProject(payload).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 201) {
              // TODO
              // this.reuseService.notifyComponents();
              this.id = res.id;
              return this.studyComponent.onSave(res.id).pipe(
                mergeMap((success) => {
                  if (success) {
                    this.toastr.success('Data added successfully');
                    return of(true);
                  }
                  return of(false);
                })
              );
            } else {
              this.toastr.error(res.message, 'Error adding project', { timeOut: 60000, extendedTimeOut: 60000 });
              return of(false);
            }
          }), catchError(err => {
            this.toastr.error(err.message, 'Error adding project', { timeOut: 60000, extendedTimeOut: 60000 });
            return of(false);
          })
        );

        saveObs$.push(success);
      }

      // Subscring to all observables
      combineLatest(fsObs$).pipe(
        mergeMap((successArr: boolean[]) => {
          const success: boolean = successArr.every(b => b);
          
          if (!success) {
            this.toastr.error('Failed to add funding sources');
            return of([false]);
          }

          // Querying the DB to update funding sources list for next edit/add
          this.contextService.updateFundingSources();
          return combineLatest(saveObs$);
        }),
        map((successArr) => {
          const success: boolean = successArr.every(b => b);
          if (success) {
            this.router.navigate([`/projects/${this.id}/view`]);
          }
        })
      ).subscribe();

    } else {
      this.spinner.hide();
      setTimeout(() => {  // Timeout to allow ng-invalid to appear on elements
        this.toastr.error("Please correct the errors in the form's fields.");
        this.scrollToFirstInvalidControl();
      })
    }
  }

  scrollToFirstInvalidControl() {
    /* https://stackoverflow.com/questions/71501822/angular-formgroup-scroll-to-first-invalid-input-in-a-scrolling-div */
    const form = document.getElementById('formContainer');
    console.log(form.getElementsByClassName('ng-invalid'));
    console.log(form.getElementsByClassName('ng-invalid')[0]);
    const firstInvalidControl = form.getElementsByClassName('ng-invalid')[0];
    firstInvalidControl.scrollIntoView();
    (firstInvalidControl as HTMLElement).focus();
  }

  back(): void {
    this.backService.back();
  }

  onChangeFundingSources() {
    // TODO: add option that says to start typing to add a new funding source when nothing has been typed, and remove it once typing starts?
    // TODO: hide ga number field on view as well?
    if (this.projectForm.value.fundingSources?.length == 1 
      && this.projectForm.value.fundingSources[0]?.name?.toLowerCase() == "private funding" 
      && !this.projectForm.get('gaNumber').disabled) {
      this.projectForm.get('gaNumber').disable();
    } else if (this.projectForm.get('gaNumber').disabled) {
      this.projectForm.get('gaNumber').enable();
    }
  }

  // Necessary to write it like this otherwise fundingSources is undefined
  addFundingSource = (fundingSource) => {
    const newSource = {'id': -1, 'name': fundingSource};
    this.fundingSources.push(newSource);
    return newSource;
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }

  searchFundingSources(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1;
  }

  displayFundingSources(fundingSources) {
    if (fundingSources) {
      return fundingSources.map(fs => fs.name).join(", ");
    }
    return "";
  }

  deleteFundingSource($event, fsToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (fsToRemove.id == -1) {  // Created locally by user
      this.fundingSources = this.fundingSources.filter(fs => !(fs.id == fsToRemove.id && fs.name == fsToRemove.name));
    } else {  // Already existing
      this.spinner.show();
      // Checking if other projects have this funding source
      this.listService.getProjectsByFundingSource(fsToRemove.id).subscribe((res: []) => {
        // Filtering out current project, as deletion on current project means the funding source has been de-selected
        let resWithoutCurrent: ProjectInterface[] = res;
        if (!this.isAdd) {
          resWithoutCurrent = res.filter((project: ProjectInterface) => project.id != this.id);
        }

        if (resWithoutCurrent.length > 0) {
          this.toastr.error(`Failed to delete this funding source as it is used in project${(resWithoutCurrent.length > 1) ? 's' : ''}:\
           ${resWithoutCurrent.map(proj => proj.shortName).join(", ")}`, "Error deleting funding source", { timeOut: 20000, extendedTimeOut: 20000 });
           this.spinner.hide();
        } else {
          // Delete funding source from the DB, then locally if succeeded
          this.contextService.deleteFundingSource(fsToRemove.id).subscribe((res: any) => {
            if (res.status !== 204) {
              this.toastr.error('Error when deleting funding source', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
            } else {
              // Locally filtering it out
              this.fundingSources = this.fundingSources.filter(fs => !(fs.id == fsToRemove.id && fs.name == fsToRemove.name));
              // Querying the DB to update funding sources list for next edit/add
              this.contextService.updateFundingSources();
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

  jsonExport() {
    this.projectService.getProjectById(this.id).subscribe((res: any) => {
      if (res) {
        const payload = JSON.parse(JSON.stringify(res));
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
