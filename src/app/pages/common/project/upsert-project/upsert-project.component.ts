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
import { colorHash, dateToString, stringToDate } from 'src/assets/js/util';
import { UpsertStudyComponent } from '../../study/upsert-study/upsert-study.component';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { FundingSourceInterface } from 'src/app/_rms/interfaces/context/funding-source.interface';
import { ServiceInterface } from 'src/app/_rms/interfaces/context/service.interface';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { PersonInterface } from 'src/app/_rms/interfaces/person.interface';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddPersonModalComponent } from '../../add-person-modal/add-person-modal.component';

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
  persons: PersonInterface[] = [];
  isBrowsing: boolean = false;
  isManager: any;
  orgId: string;
  associatedObjects: any;
  pageSize: Number = 10000;
  showEdit: boolean = false;
  hasPublicFunding: boolean = false;

  constructor(private contextService: ContextService,
              private fb: UntypedFormBuilder, 
              private router: Router, 
              private projectService: ProjectService, 
              private listService: ListService,
              private reuseService: ReuseService,
              private modalService: NgbModal,
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
      coordinator: null,
      cEuco: null,
      totalPatientsExpected: '',
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

    this.contextService.persons.subscribe((persons) => {
      this.persons = persons;
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
      totalPatientsExpected: this.projectData.totalPatientsExpected,
      coordinator: this.projectData.coordinator,
      cEuco: this.projectData.cEuco,
      studyData: this.projectData.studies,
      fundingSources: this.projectData.fundingSources,
      services: this.projectData.services,
      reportingPeriods: this.projectData.reportingPeriods,
    });

    this.onChangeFundingSources();
  }

  allFormsValid() {
    this.submitted = true;
    return this.projectForm.valid && this.studyComponent.allFormsValid();
  }

  updatePayload(payload) {
    payload.startDate = dateToString(payload.startDate);
    payload.endDate = dateToString(payload.endDate);

    if (payload.cEuco?.id) {
      payload.cEuco = payload.cEuco.id;
    }

    if (payload.fundingSources?.length > 0) {
      for (let i = 0; i < payload.fundingSources.length; i++) {
        if (payload.fundingSources[i]?.id) {
          payload.fundingSources[i] = payload.fundingSources[i].id;
        }
      }
    } else {
      payload.fundingSources = [];
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
  }

  onSave() {
    this.spinner.show();
    if (localStorage.getItem('updateProjectList')) {
      localStorage.removeItem('updateProjectList');
    }

    if (this.allFormsValid()) {
      const payload = JSON.parse(JSON.stringify(this.projectForm.value));
      this.updatePayload(payload);

      let saveObs$: Array<Observable<boolean>> = [];

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

      // Subscribing to all observables
      combineLatest(saveObs$).pipe(
        map((successArr: boolean[]) => {
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
    if (this.projectForm.value.fundingSources?.length > 0 && 
      !(this.projectForm.value.fundingSources?.length == 1 && this.projectForm.value.fundingSources[0]?.name?.toLowerCase() == "private funding" )) {
        this.hasPublicFunding = true;
    } else {
      this.hasPublicFunding = false;
    }
  }

  // Necessary to write it as an arrow function
  addFundingSource = (fsName) => {
    let fs = {"id": "", "name": ""};
    
    this.spinner.show();
    return this.contextService.addFundingSource({'name': fsName}).pipe(
      mergeMap((s: any) => {
        fs.id = s.id;
        fs.name = s.name;
        return this.contextService.updateFundingSources();
      }),
      mergeMap(() => {
        this.spinner.hide();
        return of(fs);
      }),
      catchError((err) => {
        this.toastr.error(err, "Error adding funding source", { timeOut: 20000, extendedTimeOut: 20000 });
        return of(null);
      })
    ).toPromise();
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
              // Updating funding sources list
              this.contextService.updateFundingSources().subscribe(() => {
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

  // Necessary to write it as an arrow function
  addService = (serviceName) => {
    let service = {"id": "", "name": ""};
    
    this.spinner.show();
    return this.contextService.addService({'name': serviceName}).pipe(
      mergeMap((s: any) => {
        service.id = s.id;
        service.name = s.name;
        return this.contextService.updateServices();
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

  searchServices(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1;
  }

  displayServices(services) {
    if (services) {
      return services.map(fs => fs.name).join(", ");
    }
    return "";
  }

  deleteService($event, sToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (sToRemove.id == -1) {  // Created locally by user
      this.services = this.services.filter(s => !(s.id == sToRemove.id && s.name == sToRemove.name));
    } else {  // Already existing
      this.spinner.show();
      // Checking if other projects have this service
      this.listService.getProjectsByService(sToRemove.id).subscribe((res: []) => {
        // Filtering out current project, as deletion on current project means the service has been de-selected
        let resWithoutCurrent: ProjectInterface[] = res;
        if (!this.isAdd) {
          resWithoutCurrent = res.filter((project: ProjectInterface) => project.id != this.id);
        }

        if (resWithoutCurrent.length > 0) {
          this.toastr.error(`Failed to delete this service as it is used in project${(resWithoutCurrent.length > 1) ? 's' : ''}:\
           ${resWithoutCurrent.map(proj => proj.shortName).join(", ")}`, "Error deleting service", { timeOut: 20000, extendedTimeOut: 20000 });
           this.spinner.hide();
        } else {
          // Delete service from the DB, then locally if succeeded
          this.contextService.deleteService(sToRemove.id).subscribe((res: any) => {
            if (res.status !== 204) {
              this.toastr.error('Error when deleting service', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
            } else {
              // Updating services list
              this.contextService.updateServices().subscribe(() => {
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

  // Necessary to write it as an arrow function
  addPerson = (person) => {
    const addPersonModal = this.modalService.open(AddPersonModalComponent, { size: 'lg', backdrop: 'static' });
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
        })
      ).toPromise();
    })
    .catch((err) => {
      this.spinner.hide();
      return null;
    });
  }

  searchPersons(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.fullName?.toLocaleLowerCase().indexOf(term) > -1 || item.email?.toLocaleLowerCase().indexOf(term) > -1;
  }

  // TODO: generic method
  deletePerson($event, pToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (pToRemove.id == -1) {  // Created locally by user
      this.persons = this.persons.filter(s => !(s.id == pToRemove.id && s.fullName == pToRemove.fullName));
    } else {  // Already existing
      this.spinner.show();
      // Checking if other projects have this service
      this.listService.getProjectsByPerson(pToRemove.id).subscribe((res: []) => {
        // Filtering out current project, as deletion on current project means the service has been de-selected
        let resWithoutCurrent: ProjectInterface[] = res;
        if (!this.isAdd) {
          resWithoutCurrent = res.filter((project: ProjectInterface) => project.id != this.id);
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
            } else {
              // Updating persons list
              this.contextService.updatePersons().subscribe(() => {
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

  getTotalNumberOfSites() {
    return "Coming soon!";
  }

  getTagTextColor(text) {
    return colorHash(text)?.hex;
  }

  getTagBgColor(text) {
    const h = colorHash(text);
    return `rgb(${h.r} ${h.g} ${h.b} / 0.15)`;
  }

  getHttpLink(link: string) {
    if (link && !link.toLowerCase().startsWith("http")) {
      return "https://" + link;
    }
    return link;
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
