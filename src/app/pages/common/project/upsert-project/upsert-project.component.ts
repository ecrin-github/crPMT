import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ClassValueInterface } from 'src/app/_rms/interfaces/context/class-value.interface';
import { OrganisationInterface } from 'src/app/_rms/interfaces/context/organisation.interface';
import { PersonInterface } from 'src/app/_rms/interfaces/context/person.interface';
import { ProjectInterface } from 'src/app/_rms/interfaces/core/project.interface';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { JsonGeneratorService } from 'src/app/_rms/services/entities/json-generator/json-generator.service';
import { ProjectService } from 'src/app/_rms/services/entities/project/project.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { dateToString, getTagBgColor, getTagBorderColor, stringToDate } from 'src/assets/js/util';
import { UpsertStudyComponent } from '../../study/upsert-study/upsert-study.component';
import { UpsertReportingPeriodComponent } from '../../reporting-period/upsert-reporting-period/upsert-reporting-period.component';

@Component({
  selector: 'app-upsert-project',
  templateUrl: './upsert-project.component.html',
  styleUrls: ['./upsert-project.component.scss'],
  providers: [ScrollService]
})
export class UpsertProjectComponent implements OnInit {

  @ViewChild(UpsertStudyComponent) studyComponent: UpsertStudyComponent;
  @ViewChild(UpsertReportingPeriodComponent) reportingPeriodComponent: UpsertReportingPeriodComponent;

  fundingSources: ClassValueInterface[] = [];
  organisations: OrganisationInterface[] = [];
  services: ClassValueInterface[] = [];
  persons: PersonInterface[] = [];
  id: string;
  isAdd: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  hasPublicFunding: boolean = false;
  showEdit: boolean = false;
  submitted: boolean = false;
  sticky: boolean = false;
  projectData: ProjectInterface;
  projectForm: UntypedFormGroup;

  constructor(private contextService: ContextService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private projectService: ProjectService,
    private reuseService: ReuseService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private jsonGenerator: JsonGeneratorService,
    private backService: BackService) {
    this.projectForm = this.fb.group({
      name: '',
      shortName: ['', Validators.required],
      coordinator: null,
      coordinatingInstitution: null,
      startDate: null,
      endDate: null,
      fundingSources: [],
      gaNumber: '',
      studyData: [],
      reportingPeriods: [],
      publicSummary: null,
      url: '',
      // totalPatientsExpected: '',
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.spinner.show();
    });

    this.id = this.activatedRoute.snapshot.params.id;

    // this.scrollService.handleScroll([`/projects/${this.id}/view`, `/projects/${this.id}/edit`, `/projects/add`]);

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

    this.contextService.organisations.subscribe((organisations) => {
      this.organisations = organisations;
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
      name: this.projectData.name,
      shortName: this.projectData.shortName,
      coordinator: this.projectData.coordinator,
      coordinatingInstitution: this.projectData.coordinatingInstitution,
      startDate: this.projectData.startDate ? stringToDate(this.projectData.startDate) : null,
      endDate: this.projectData.endDate ? stringToDate(this.projectData.endDate) : null,
      fundingSources: this.projectData.fundingSources,
      gaNumber: this.projectData.gaNumber,
      studyData: this.projectData.studies,
      reportingPeriods: this.projectData.reportingPeriods,
      publicSummary: this.projectData.publicSummary,
      url: this.projectData.url,
      // TODO: publications
      // totalPatientsExpected: this.projectData.totalPatientsExpected,
    });

    this.onChangeFundingSources();
  }

  allFormsValid() {
    this.submitted = true;

    if (!this.projectForm.valid) {
      this.toastr.error("Please correct the errors in the project form");
    }

    return this.projectForm.valid && this.studyComponent.allFormsValid();
  }

  updatePayload(payload) {
    payload.startDate = dateToString(payload.startDate);
    payload.endDate = dateToString(payload.endDate);

    if (payload.coordinator?.id) {
      payload.coordinator = payload.coordinator.id;
    }

    if (payload.coordinatingInstitution?.id) {
      payload.coordinatingInstitution = payload.coordinatingInstitution.id;
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
  }

  onSave() {
    this.spinner.show();

    if (this.allFormsValid()) {
      const payload = JSON.parse(JSON.stringify(this.projectForm.value));
      this.updatePayload(payload);

      let projectQueryObs$: Observable<Object>;

      if (this.isEdit) {  // Edit
        projectQueryObs$ = this.projectService.editProject(this.id, payload);
      } else {  // Add
        projectQueryObs$ = this.projectService.addProject(payload);
      }

      const success = projectQueryObs$.pipe(
        mergeMap((res: any) => {
          if ((this.isEdit && res.statusCode === 200) || (this.isAdd && res.statusCode === 201)) {
            let saveObs$: Array<Observable<boolean>> = [];

            // Studies
            saveObs$.push(this.studyComponent.onSave(res.id).pipe(
              mergeMap((successArr: boolean[]) => {
                return of(successArr.every(b => b));
              })
            ));

            // Reporting periods
            saveObs$.push(this.reportingPeriodComponent.onSave(res.id).pipe(
              mergeMap((successArr: boolean[]) => {
                return of(successArr.every(b => b));
              })
            ));

            return combineLatest(saveObs$);
          } else {
            this.toastr.error(res.message, "Error saving project", { timeOut: 60000, extendedTimeOut: 60000 });
            return of(false);
          }
        }), catchError(err => {
          this.toastr.error(err.message, 'Error saving project', { timeOut: 60000, extendedTimeOut: 60000 });
          return of(false);
        })
      );

      success.pipe(
        map((successArr: boolean[]) => {
          const success: boolean = successArr.every(b => b);
          if (success) {
            this.toastr.success('Data saved successfully');
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
    const firstInvalidControl = form.getElementsByClassName('ng-invalid')[0];
    // firstInvalidControl.scrollIntoView();
    (firstInvalidControl as HTMLElement).focus();
  }

  back(): void {
    this.backService.back();
  }

  onChangeFundingSources() {
    if (this.projectForm.value.fundingSources?.length > 0 &&
      !(this.projectForm.value.fundingSources?.length == 1 && this.projectForm.value.fundingSources[0]?.value?.toLowerCase() == "private funding")) {
      this.hasPublicFunding = true;
    } else {
      this.hasPublicFunding = false;
    }
  }

  // Necessary to write it as an arrow function
  addFundingSource = (fsValue) => {
    let fs = { "id": "", "value": "" };

    this.spinner.show();
    return this.contextService.addFundingSource({ 'value': fsValue }).pipe(
      mergeMap((s: any) => {
        fs.id = s.id;
        fs.value = s.value;
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
    return item.value?.toLocaleLowerCase().indexOf(term) > -1;
  }

  displayFundingSources(fundingSources) {
    if (fundingSources) {
      return fundingSources.map(fs => fs.value).join(", ");
    }
    return "";
  }

  deleteFundingSource($event, fsToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (fsToRemove.id == -1) {  // Created locally by user
      this.fundingSources = this.fundingSources.filter(fs => !(fs.id == fsToRemove.id && fs.value == fsToRemove.value));
    } else {  // Already existing
      this.contextService.deleteFundingSourceDropdown(fsToRemove, !this.isAdd);
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

  searchPersons = (term: string, item) => {
    return this.contextService.searchPersons(term, item);
  }

  searchCountries(term: string, item) {
    return this.contextService.searchCountries(term, item);
  }

  getTagBorderColor(text) {
    return getTagBorderColor(text);
  }

  getTagBgColor(text) {
    return getTagBgColor(text);
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
}
