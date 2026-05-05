import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of, Subscription } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { ClassValueInterface } from 'src/app/_rms/interfaces/context/class-value.interface';
import { GraphApiService } from 'src/app/_rms/services/common/graph-api/graph-api.service';
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
import { REGULATORY_FRAMEWORKS, STUDY_STATUSES, TIME_UNITS } from 'src/assets/js/constants';
import { ProjectInterface } from 'src/app/_rms/interfaces/core/project.interface';


@Component({
  selector: 'app-upsert-study',
  templateUrl: './upsert-study.component.html',
  styleUrls: ['./upsert-study.component.scss'],
  providers: [ScrollService]
})
export class UpsertStudyComponent implements OnInit {

  @ViewChildren('studyCountries') studyCountryComponents: QueryList<UpsertStudyCountryComponent>;
  @Input() studiesData: Array<StudyInterface>;
  @Input() project: ProjectInterface;

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
  REGULATORY_FRAMEWORKS: String[] = REGULATORY_FRAMEWORKS;
  STUDY_STATUSES: String[] = STUDY_STATUSES;
  TIME_UNITS: String[] = TIME_UNITS;
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
  public riskItems: any[] = [];
  public riskLoading: boolean = false;
  public riskError: string = null;
  public currentProjectShortName: string = null;
  private subscriptions: Subscription[] = [];
  nonComplianceItems: any[] = [];
  nonComplianceLoading: boolean = false;
  nonComplianceError: string = '';
  allNonComplianceItems: any[] = [];
  

  constructor(private fb: UntypedFormBuilder,
    private router: Router,
    private projectService: ProjectService,
    private studyService: StudyService,
    private contextService: ContextService,
    private modalService: NgbModal,
    private scrollService: ScrollService,
    private activatedRoute: ActivatedRoute,
    private graphApiService: GraphApiService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private jsonGenerator: JsonGeneratorService,
    private backService: BackService,
    private graphApi: GraphApiService) {
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

    if (this.isStudyPage && this.isView) {
      this.subscribeToNonComplianceRegister();
    }

    if (this.isAdd) {
      setTimeout(() => {
        this.spinner.hide();
      });
    }
  }
  goToStudyCtu(event: MouseEvent, studyCtuId: number | string): void {
  event.preventDefault();
  event.stopPropagation();
  this.router.navigate(['/study-ctus', studyCtuId, 'view']);
  }

  private subscribeToNonComplianceRegister(): void {
    this.nonComplianceLoading = true;

    this.graphApi.nonComplianceRegister$.subscribe((items: any[]) => {
      this.allNonComplianceItems = items || [];
      this.filterNonComplianceByProject();
      this.nonComplianceLoading = false;
    }, (error) => {
      console.error('Error loading non-compliance register:', error);
      this.nonComplianceError = 'Unable to load SharePoint non-compliance register.';
      this.nonComplianceLoading = false;
    });
  }

  getNonConformityStatusClass(status: string): string {
    const normalized = status?.toLowerCase()?.trim();

    if (normalized === 'open') {
      return 'nc-status-open';
    }

    if (normalized === 'closed') {
      return 'nc-status-closed';
    }

    return 'tag-ctu';
  }

  private filterNonComplianceByProject(): void {
    const allItems = this.allNonComplianceItems || [];

    if (!this.studies || this.studies.length === 0) {
      this.nonComplianceItems = [];
      return;
    }

    const currentStudy = this.studies[0];
    const currentProject = currentStudy?.project?.shortName;

    if (!currentProject) {
      this.nonComplianceItems = [];
      return;
    }

    const normalizedCurrentProject = this.normalizeText(currentProject);

    this.nonComplianceItems = allItems.filter((item) => {
      const projectNames = this.extractSharePointProjectNames(item.projectName);

      if (!projectNames.length || !normalizedCurrentProject) {
        return false;
      }

      return projectNames.some((spProject) =>
        spProject === normalizedCurrentProject ||
        spProject.includes(normalizedCurrentProject)
      );
    });
  }

  private extractSharePointProjectNames(value: any): string[] {
    if (!value) {
      return [];
    }

    return value
      .toString()
      .split(/\r?\n/)
      .map((project) => project.replace(/^\s*-\s*/, '').trim())
      .map((project) => this.normalizeText(project))
      .filter(Boolean);
  }

  private normalizeText(value: any): string {
    return value?.toString().toLowerCase().trim().replace(/\s+/g, ' ') || '';
  }

  get fc() { return this.studyForm.get('studies')["controls"]; }
  get fv() { return this.studyForm.get('studies')?.value; }

  getControls(i) {
    return this.fc[i].controls;
  }

  getStudiesForm(): UntypedFormArray {
    return this.studyForm.get('studies') as UntypedFormArray;
  }

  newStudy(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      shortTitle: [null, Validators.required],
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
      project: this.project,
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
      this.currentProjectShortName = studyData.project?.shortName || null;
      this.patchStudyForm();

      if (this.isView) {
        this.loadRiskRegisterData(this.currentProjectShortName);
        this.filterNonComplianceByProject();
      }
    }
  }

  private loadRiskRegisterData(projectShortName: string): void {
    this.riskError = null;
    this.riskItems = [];
    this.riskLoading = true;

    if (!projectShortName) {
      this.riskLoading = false;
      return;
    }

    const currentProject = this.normalizeRiskProjectName(projectShortName);

    this.subscriptions.push(
      this.graphApiService.riskRegister$.subscribe(
        (items: any[]) => {
          this.riskItems = (items || []).filter((risk) => {
            const riskProject = this.normalizeRiskProjectName(risk.projectShortName);

            return (
              riskProject === currentProject ||
              riskProject.includes(currentProject) ||
              currentProject.includes(riskProject)
            );
          }).sort((a, b) => this.getRiskSortValue(b.riskScore) - this.getRiskSortValue(a.riskScore)); // Sort highest risk first
          this.riskLoading = false;
        },
        () => {
          this.riskError = 'Unable to load SharePoint risk register.';
          this.riskLoading = false;
        }
      )
    );
  }

  private normalizeRiskProjectName(value: any): string {
    return value?.toString().toLowerCase().trim().replace(/\s+/g, ' ') || '';
  }

  getRiskLevel(score: any): string {
    if (score == null || score === '') {
      return 'Unknown';
    }

    const normalized = String(score).trim();
    if (/^(low|medium|high)$/i.test(normalized)) {
      return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
    }

    const numeric = Number(normalized);
    if (!isNaN(numeric)) {
      if (numeric >= 0 && numeric <= 6) return 'Low';
      if (numeric >= 7 && numeric <= 12) return 'Medium';
      if (numeric >= 13 && numeric <= 16) return 'High';
      return 'Unknown';
    }

    return 'Unknown';
  }

  getRiskTooltipDescription(risk: any): string {
    return risk?.description || 'No description available';
  }

  hasAfterMitigationScore(item: any): boolean {
    return item?.riskScoreAfterMitigation !== null
      && item?.riskScoreAfterMitigation !== undefined
      && item?.riskScoreAfterMitigation !== '';
  }

  getRiskBadgeClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'low': return 'tag-success';
      case 'medium': return 'tag-warning';
      case 'high': return 'tag-danger';
      default: return 'tag-secondary';
    }
  }

  formatNextReviewDate(date: any): string {
    if (!date) return 'N/A';
    try {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) return 'Invalid Date';
      return parsed.toLocaleDateString('en-GB'); // dd/MM/yyyy
    } catch {
      return 'Invalid Date';
    }
  }

  private getRiskSortValue(score: any): number {
    const level = this.getRiskLevel(score);
    switch (level?.toLowerCase()) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
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
      const removeModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
      removeModal.componentInstance.setDefaultDeleteMessage("study");

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
      }, error => { this.toastr.error(error) });
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
        shortTitle: [s.shortTitle, Validators.required],
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

      if (s.summary?.length) {
        this.summaryRemainingChars[index] = this.summaryMaxChars - s.summary.length;
      } else {

        this.summaryRemainingChars[index] = this.summaryMaxChars;
      }
    });
    return formArray;
  }

  patchStudyForm() {
    this.studyForm.setControl('studies', this.getFormArray());

    // Setting initial boolean variables to display or not certain fields
    for (let i = 0; i < this.fc.length; i++) {
      this.onChangeAgreementSigned(i);
      this.onChangeComplexTrialDesign(i);
      this.onChangeRegulatoryFramework(i, true);
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
        maxOrder = payload.project.studies[payload.project.studies.length - 1].order;
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

    if (payload.coordinatingCountry?.iso2) {
      payload.coordinatingCountry = payload.coordinatingCountry.iso2;
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

    if (payload.sponsorCountry?.iso2) {
      payload.sponsorCountry = payload.sponsorCountry.iso2;
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

      let itemObs$: Observable<Object> = null;

      if (!item.id) {  // Add
        itemObs$ = this.studyService.addStudy(item);
      } else {
        itemObs$ = this.studyService.editStudy(item.id, item);
      }

      saveObs$.push(itemObs$.pipe(
        mergeMap((res: any) => {
          if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
            if (this.isStudyPage && this.isAdd) {  // Need id for redirection if single study add
              this.id = res.id;
            }

            if (this.studyCountryComponents.get(i)) { // Saving study countries
              return this.studyCountryComponents.get(i).onSave(res.id).pipe(
                mergeMap((successArr: boolean[]) => {
                  return of(successArr.every(b => b));
                })
              );
            }
            return of(true);
          }

          this.toastr.error(res.message, "Failed to save study", { timeOut: 60000, extendedTimeOut: 60000 });
          return of(false);
        }), catchError(err => {
          this.toastr.error(err.message, 'Failed to save study', { timeOut: 60000, extendedTimeOut: 60000 });
          return of(false);
        })
      ));
    }

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
            this.toastr.success("Changes saved successfully");
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

  compareCountries(c1, c2): boolean {
    return c1?.iso2 == c2?.iso2;
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

  onChangeRegulatoryFramework(i, isInit = false) {
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

    if (!isInit) {
      this.getControls(i)["regulatoryFrameworkDetails"]?.setValue(null);
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
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
