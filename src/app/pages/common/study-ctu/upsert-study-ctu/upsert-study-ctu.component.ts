import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

import { ClassValueInterface } from 'src/app/_rms/interfaces/context/class-value.interface';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { CTUInterface } from 'src/app/_rms/interfaces/context/ctu.interface';
import { StudyCountryInterface } from 'src/app/_rms/interfaces/core/study-country.interface';
import { StudyCTUInterface } from 'src/app/_rms/interfaces/core/study-ctus.interface';

import { BackService } from 'src/app/_rms/services/back/back.service';
import { GraphApiService } from 'src/app/_rms/services/common/graph-api/graph-api.service';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { StudyCtuService } from 'src/app/_rms/services/entities/study-ctu/study-ctu.service';
import { CtuMapperService } from 'src/app/_rms/services/entities/study-ctu/ctu-mapper.service';

import {
  dateToString,
  getFlagEmoji,
  getTagBgColor,
  getTagBorderColor,
  getYYYYMMDDFromDateString
} from 'src/assets/js/util';

import { UpsertCentreComponent } from '../../centre/upsert-centre/upsert-centre.component';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { UpsertCtuAgreementComponent } from '../../ctu-agreement/upsert-ctu-agreement/upsert-ctu-agreement.component';
import { CtuEvaluationResults, SasVerificationResults, ctuEvaluationsListUrl, sasTrackerListUrl } from 'src/assets/js/constants';

@Component({
  selector: 'app-upsert-study-ctu',
  templateUrl: './upsert-study-ctu.component.html',
  styleUrls: ['./upsert-study-ctu.component.scss']
})
export class UpsertStudyCtuComponent implements OnInit {
  @ViewChildren('ctuAgreements') ctuAgreementComponents: QueryList<UpsertCtuAgreementComponent>;
  @ViewChildren('centres') centreComponents: QueryList<UpsertCentreComponent>;
  @Input() studyCTUsData: Array<StudyCTUInterface>;
  @Input() studyCountry: StudyCountryInterface;

  public ctuEvaluationsListUrl: string = ctuEvaluationsListUrl;
  static intPatternValidatorFn: ValidatorFn = Validators.pattern('^[0-9]*$');

  id: string;
  form: UntypedFormGroup;
  submitted = false;
  isEdit = false;
  isView = false;
  isAdd = false;
  isSctuPage = false;

  // Real SharePoint CTUs only
  sharePointCtus: any[] = [];

  // Fallback DB CTUs
  dbCtus: CTUInterface[] = [];

  // CTUs displayed in the dropdown: SharePoint if available, DB otherwise
  displayCtus: any[] = [];

  countries: CountryInterface[] = [];
  services: ClassValueInterface[] = [];
  studyCTUs: StudyCTUInterface[] = [];
  ctuEvaluations: any[] = [];
  loadingCTUEvaluations: boolean = false;
  public sasTrackerListUrl: string = sasTrackerListUrl;
  sasVerifications: any[] = [];
  loadingSASVerifications: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private backService: BackService,
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private contextService: ContextService,
    private graphApi: GraphApiService,
    private spinner: NgxSpinnerService,
    private studyCTUService: StudyCtuService,
    private ctuMapperService: CtuMapperService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      studyCTUs: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.initPageFlags();
    this.loadInitialStudyCtuIfNeeded();
    this.subscribeToDbCtus();
    this.subscribeToCountries();
    this.subscribeToSharePointCtus();
    this.subscribeToServices();
  }

  private initPageFlags(): void {
    if (this.router.url.includes('study-ctus')) {
      this.id = this.activatedRoute.snapshot.params.id;
      this.isSctuPage = true;
    }

    if (this.isSctuPage) {
      setTimeout(() => {
        this.spinner.show();
      });
    }

    this.isAdd = this.router.url.includes('add');
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
  }

  private loadInitialStudyCtuIfNeeded(): void {
    const queryFuncs: Array<Observable<any>> = [];

    if (this.isSctuPage && !this.isAdd) {
      queryFuncs.push(this.getStudyCTU(this.id));
    }

    if (queryFuncs.length === 0) {
      setTimeout(() => {
        this.spinner.hide();
      });
      return;
    }

    const obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error)))));
    });

    combineLatest(obsArr).subscribe(res => {
      if (this.isSctuPage && !this.isAdd) {
        this.setStudyCTU(res.pop());
      }

      setTimeout(() => {
        this.spinner.hide();
      });
    });
  }

  private subscribeToDbCtus(): void {
    this.contextService.ctus.subscribe((ctus) => {
      this.dbCtus = ctus || [];

      // Use DB data only as a display fallback.
      // Do not copy DB CTUs into sharePointCtus.
      if ((!this.displayCtus || this.displayCtus.length === 0) && this.dbCtus.length > 0) {
        this.displayCtus = [...this.dbCtus];
        this.sortCTUs();
      }
    });
  }

  private subscribeToCountries(): void {
    this.contextService.countries.subscribe((countries) => {
      this.countries = countries || [];
    });
  }

  private subscribeToSharePointCtus(): void {
    this.graphApi.ctusServiceProviders$.subscribe((ctus) => {

      // Keep only real SharePoint data here.
      this.sharePointCtus = ctus?.length > 0 ? [...ctus] : [];

      // Fix country ISO2 for SharePoint CTUs if they have ISO3 codes
      this.sharePointCtus.forEach(ctu => {
        if (ctu.country?.iso2 && this.countries?.length > 0) {
          const correctIso2 = this.ctuMapperService.findCountryIso2FromSharePoint(ctu, this.countries);
          if (correctIso2 && correctIso2 !== ctu.country.iso2) {
            ctu.country.iso2 = correctIso2;
            const countryMatch = this.countries.find(c => c.iso2 === correctIso2);
            if (countryMatch) {
              ctu.country.name = countryMatch.name;
            }
          }
        }
      });

      // Display SharePoint CTUs when available, otherwise fallback to DB CTUs.
      this.displayCtus = this.sharePointCtus.length > 0
        ? [...this.sharePointCtus]
        : [...this.dbCtus];

      if (this.displayCtus?.length > 0) {
        this.sortCTUs();

        // Re-patch the form so existing DB CTUs can be replaced by
        // their SharePoint version when SharePoint data is available.
        if (this.studyCTUs?.length > 0) {
          this.patchForm();
        }
      }
    });
  }

  private subscribeToServices(): void {
    this.contextService.services.subscribe((services) => {
      this.services = services;
    });
  }

  get g() { return this.form.get('studyCTUs')['controls']; }
  get fv() { return this.getStudyCTUsForm()?.value; }
  get fc() { return this.getStudyCTUsForm()?.controls; }

  getControls(i) {
    return this.g[i].controls;
  }

  getStudyCTUsForm(): UntypedFormArray {
    return this.form.get('studyCTUs') as UntypedFormArray;
  }

  newStudyCTU(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      leadCtu: false,
      services: [],
      study: this.studyCountry?.study,
      studyCountry: this.studyCountry,
      ctu: [null, Validators.required],
      ctuAgreements: [],
      centres: null
    });
  }

  getStudyCTU(id) {
    return this.studyCTUService.getStudyCTU(id);
  }

  setStudyCTU(sctuData) {
    if (sctuData) {
      delete sctuData['statusCode'];
      this.studyCTUs = [sctuData];
      this.id = sctuData.id;
      this.patchForm();
    }
  }

  patchForm() {
    this.form.setControl('studyCTUs', this.patchArray());
    this.onChangeCTU();
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.studyCTUs.forEach((sctu) => {
      formArray.push(this.fb.group({
        id: sctu.id,
        leadCtu: sctu.leadCtu,
        services: [sctu.services],
        study: sctu.study,
        studyCountry: sctu.studyCountry,
        ctu: this.mapExistingCtuToDisplayedCtu(sctu.ctu),
        ctuAgreements: [sctu.ctuAgreements],
        centres: [sctu.centres]
      }));
    });
    return formArray;
  }

  sortCTUs() {
    const countryISO2 =
      this.studyCountry?.country?.iso2 ||
      this.form.value.studyCTUs[0]?.studyCountry?.country?.iso2;

    if (!countryISO2 || !this.displayCtus?.length) {
      return;
    }

    const { compare } = Intl.Collator('en-GB');

    this.displayCtus.sort((a, b) => {
      if (a.country?.iso2?.localeCompare(countryISO2) === 0) {
        if (b.country?.iso2?.localeCompare(countryISO2) === 0) {
          return compare((a.shortName || '') + (a.name || ''), (b.shortName || '') + (b.name || ''));
        }
        return -1;
      } else if (b.country?.iso2?.localeCompare(countryISO2) === 0) {
        return 1;
      } else {
        const countryCompare = (a.country?.name || '').localeCompare(b.country?.name || '');
        if (countryCompare > 0) {
          return 1;
        } else if (countryCompare < 0) {
          return -1;
        } else {
          return compare((a.shortName || '') + (a.name || ''), (b.shortName || '') + (b.name || ''));
        }
      }
    });
  }

  resolveCtuId(selectedCtu: any): Observable<number | null> {
    if (!selectedCtu) {
      return of(null);
    }

    const fallbackDbId = selectedCtu?.id || null;

    // Always try to use the real SharePoint version when possible.
    const ctuToResolve = this.getSharePointVersionOfCtu(selectedCtu) || selectedCtu;

    const countryIso2 = this.ctuMapperService.findCountryIso2FromSharePoint(ctuToResolve, this.countries);

    if (!countryIso2) {
      if (fallbackDbId) {
        return of(fallbackDbId);
      }

      this.toastr.error('Unable to map CTU country from SharePoint to database country.');
      return of(null);
    }

    const payload = {
      sharepoint_item_id: ctuToResolve?.sharepointItemId || null,
      name: ctuToResolve?.name || null,
      short_name: ctuToResolve?.shortName || null,
      country_iso2: countryIso2,
      sas_verification: !!ctuToResolve?.sasVerification,
      address_info: ctuToResolve?.addressInfo || null
    };


    return this.contextService.resolveSharePointCtu(payload).pipe(
      map((res: any) => {
        return res?.id || fallbackDbId || null;
      }),
      catchError(() => {
        if (fallbackDbId) {
          return of(fallbackDbId);
        }

        this.toastr.error('Failed to resolve CTU from SharePoint.');
        return of(null);
      })
    );
  }

  cleanAddress(address) {
    if (!address) {
      return null;
    }
    return address.replace('\n', ' ');
  }

  toggleCTUInfo(event) {
    const ctuInfoElement = event.target.closest('.ctuPanel').getElementsByClassName('ctuInfo')[0];
    const expanded = ctuInfoElement.getAttribute('aria-expanded') === 'true';
    ctuInfoElement.setAttribute('aria-expanded', `${!expanded}`);

    if (expanded) {
      ctuInfoElement.classList.add('hideCTUInfo');
      ctuInfoElement.classList.remove('displayCTUInfo');

      event.target.classList.add('ctuToggleButtonClosed');
      event.target.classList.remove('ctuToggleButtonOpened');
    } else {
      ctuInfoElement.classList.add('displayCTUInfo');
      ctuInfoElement.classList.remove('hideCTUInfo');

      event.target.classList.add('ctuToggleButtonOpened');
      event.target.classList.remove('ctuToggleButtonClosed');
    }
  }

  getCountryFlag() {
    if (this.studyCountry?.country?.iso2) {
      return getFlagEmoji(this.studyCountry.country.iso2);
    }
    return '';
  }

  getCountryFlagFromIso2(iso2) {
    return getFlagEmoji(iso2);
  }

  onChangeCTU() {
    this.loadingCTUEvaluations = true;
    this.graphApi.ctuEvaluations$.subscribe((ctuEvaluations) => {
      for (const [i, fv] of this.fv.entries()) {
        const projectShortName = fv.study?.project?.shortName?.toLowerCase()?.trim();
        const ctuShortName = fv.ctu?.shortName?.toLowerCase()?.trim();

        if (projectShortName && ctuShortName && ctuEvaluations[projectShortName]) {
          this.ctuEvaluations[i] = ctuEvaluations[projectShortName].filter(
            (fields) => fields?.CTU?.toLowerCase() === ctuShortName
          );
        } else {
          this.ctuEvaluations[i] = [];
        }
      }

      this.sortCTUEvaluations();
      this.loadingCTUEvaluations = false;
    });
    this.loadingSASVerifications = true;

    this.graphApi.sasTracker$.subscribe((sasTracker: any) => {
      for (const [i, fv] of this.fv.entries()) {
        const ctuShortName = fv.ctu?.shortName?.toLowerCase()?.trim();
        const ctuTitle = fv.ctu?.name?.toLowerCase()?.trim();

        if (ctuShortName && sasTracker[ctuShortName]) {
          this.sasVerifications[i] = sasTracker[ctuShortName];
        } else if (ctuTitle && sasTracker[ctuTitle]) {
          this.sasVerifications[i] = sasTracker[ctuTitle];
        } else {
          this.sasVerifications[i] = [];
        }
      }

      this.loadingSASVerifications = false;
    });
  }

  getSASVerificationResult(i): string | null {
    if (this.sasVerifications[i]?.length > 0) {
      const status = this.sasVerifications[i][0]?.Status?.toLowerCase()?.trim();

      if (status === 'approved') {
        return SasVerificationResults.APPROVED;
      }

      return SasVerificationResults.NOT_APPROVED;
    } else if (this.loadingSASVerifications) {
      return 'Loading...';
    }

    return null;
  }
  getSASVerificationTagClass(i): string {
    const result = this.getSASVerificationResult(i)?.toLowerCase()?.trim();

    if (result === SasVerificationResults.APPROVED.toLowerCase()) {
      return 'tag-success';
    } else if (result === SasVerificationResults.NOT_APPROVED.toLowerCase()) {
      return 'tag-danger';
    }

    return '';
  }

  sortCTUEvaluations() {
    this.ctuEvaluations.sort((a, b) =>
      (a.Created > b.Created) ? 1 : ((b.Created > a.Created) ? -1 : 0)
    );
  }

  getCTUEvaluationResult(i) {
    if (this.ctuEvaluations[i]?.length > 0) {
      return this.ctuEvaluations[i][0]?.Result;
    } else if (this.loadingCTUEvaluations) {
      return 'Loading...';
    }
    return null;
  }

  getCTUEvaluationDate(i) {
    if (this.ctuEvaluations[i]?.length > 0) {
      return `(${getYYYYMMDDFromDateString(this.ctuEvaluations[i][0]?.Created)})`;
    } else if (this.loadingCTUEvaluations) {
      return 'Loading...';
    }
    return '';
  }

  getCTUEvaluationTagClass(i) {
    let tagClass = '';
    const resultText = this.getCTUEvaluationResult(i)?.toLowerCase().trim();

    if (resultText) {
      if (resultText === CtuEvaluationResults.SATISFACTORY?.toLowerCase()) {
        tagClass = 'tag-success';
      } else if (resultText === CtuEvaluationResults.NEEDS_IMPROVEMENT?.toLowerCase()) {
        tagClass = 'tag-warning';
      } else if (resultText === CtuEvaluationResults.UNSATISFACTORY?.toLowerCase()) {
        tagClass = 'tag-danger';
      }
    }
    return tagClass;
  }

  getCTUEvaluationTagBorderColor(i) {
    return getTagBorderColor(this.getCTUEvaluationResult(i));
  }

  getCTUEvaluationTagBgColor(i) {
    return getTagBgColor(this.getCTUEvaluationResult(i));
  }



  getTagBorderColor(text) {
    return getTagBorderColor(text);
  }

  getTagBgColor(text) {
    return getTagBgColor(text);
  }

  searchClassValues = (term: string, item) => {
    return this.contextService.searchClassValues(term, item);
  }

  addService = (value) => {
    return this.contextService.addServiceDropdown(value);
  }

  deleteService($event, sToRemove) {
    $event.stopPropagation();

    if (sToRemove.id == -1) {
      this.services = this.services.filter(s => !(s.id == sToRemove.id && s.value == sToRemove.value));
    } else {
      this.contextService.deleteServiceDropdown(sToRemove, !this.isAdd);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    let patchForm = false;

    if (changes.studyCountry?.previousValue?.country?.iso2 != changes.studyCountry?.currentValue?.country?.iso2) {
      if (this.displayCtus?.length > 0) {
        this.sortCTUs();
      }
      patchForm = true;
    }

    if (changes.studyCTUsData) {
      if (this.studyCTUsData === null) {
        this.studyCTUs = [];
      } else {
        this.studyCTUs = this.studyCTUsData;
      }
      patchForm = true;
    }

    if (patchForm) {
      this.patchForm();
    }
  }

  addStudyCTU() {
    this.getStudyCTUsForm().push(this.newStudyCTU());
  }

  deleteStudyCTU($event, i: number) {
    $event.stopPropagation();

    const sctuId = this.getStudyCTUsForm().value[i].id;
    if (!sctuId) {
      this.getStudyCTUsForm().removeAt(i);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
      removeModal.componentInstance.setDefaultDeleteMessage('study CTU');

      removeModal.result.then((remove) => {
        if (remove) {
          this.studyCTUService.deleteStudyCTU(sctuId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getStudyCTUsForm().removeAt(i);
              this.studyCTUs = this.studyCTUs.filter((item: any) => item.id != sctuId);
              this.toastr.success('Study CTU deleted successfully');
            } else {
              this.toastr.error('Error when deleting study CTU', res.statusText);
            }
          }, error => {
            this.toastr.error(error);
          });
        }
      }, error => { this.toastr.error(error); });
    }
  }

  isFormValid() {
    this.submitted = true;

    for (const i in this.form.get('studyCTUs')['controls']) {
      if (this.form.get('studyCTUs')['controls'][i].value.ctu == null) {
        this.form.get('studyCTUs')['controls'][i].controls.ctu.setErrors({ required: true });
      }
    }

    if (!this.form.valid) {
      this.toastr.error('Please correct the errors in the study CTUs form');
    }

    return this.form.valid && !this.centreComponents.some(b => !b.isFormValid());
  }

  updatePayload(payload, scId, studyId, i) {
    payload.studyCountry = scId;
    payload.study = studyId;

    if (payload.recruitmentGreenlight) {
      payload.recruitmentGreenlight = dateToString(payload.recruitmentGreenlight);
    }

    if (payload.ctu?.id) {
      payload.ctu = payload.ctu.id;
    }

    if (payload.pi?.id) {
      payload.pi = payload.pi.id;
    }

    if (payload.services?.length > 0) {
      for (let j = 0; j < payload.services.length; j++) {
        if (payload.services[j]?.id) {
          payload.services[j] = payload.services[j].id;
        }
      }
    } else {
      payload.services = [];
    }

    if (!this.isSctuPage) {
      payload.order = i;
    }
  }

  onSave(scId: string, studyId: string): Observable<boolean[]> {
    this.submitted = true;
    const saveObs$: Array<Observable<boolean>> = [];
    const payload = JSON.parse(JSON.stringify(this.form.value));

    for (const [i, item] of payload.studyCTUs.entries()) {

      saveObs$.push(
        this.resolveCtuId(item.ctu).pipe(
          mergeMap((ctuId: number | null) => {
            const finalCtuId = ctuId ?? item.ctu?.id;

            if (!finalCtuId) {
              console.error('No CTU ID resolved for item:', item);
              return of(false);
            }

            item.ctu = { id: finalCtuId };
            this.updatePayload(item, scId, studyId, i);

            let itemObs$: Observable<Object>;
            if (!item.id) {
              itemObs$ = this.studyCTUService.addStudyCTUFromStudy(studyId, item);
            } else {
              itemObs$ = this.studyCTUService.editStudyCTU(item.id, item);
            }

            return itemObs$.pipe(
              mergeMap((res: any) => {

                if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
                  const subObs$: Observable<boolean>[] = [];

                  subObs$.push(
                    this.centreComponents.get(i).onSave(res.id, studyId).pipe(
                      map((successArr: boolean[]) => successArr.every(a => a))
                    )
                  );

                  subObs$.push(
                    this.ctuAgreementComponents.get(i).onSave(res.id).pipe(
                      map((successArr: boolean[]) => successArr.every(a => a))
                    )
                  );

                  return combineLatest(subObs$).pipe(
                    map((successArr: boolean[]) => successArr.every(a => a))
                  );
                }

                this.toastr.error('Failed to save Study CTU');
                return of(false);
              }),
              catchError((err) => {
                this.toastr.error(err);
                return of(false);
              })
            );
          }),
          catchError((err) => {
            this.toastr.error(err);
            return of(false);
          })
        )
      );
    }

    const formIds: Array<String> = payload.studyCTUs.map((item: StudyCTUInterface) => item.id);
    const removedItems: Array<StudyCTUInterface> = this.studyCTUs.filter(
      (previousItem: StudyCTUInterface) => formIds.indexOf(previousItem.id) < 0
    );

    removedItems.forEach((sctu: StudyCTUInterface) => {
      saveObs$.push(
        this.studyCTUService.deleteStudyCTU(sctu.id).pipe(
          mergeMap((res: any) => {
            if (res.status === 204) {
              return of(true);
            } else {
              this.toastr.error(res);
              return of(false);
            }
          }),
          catchError(err => {
            this.toastr.error(err);
            return of(false);
          })
        )
      );
    });

    if (saveObs$.length == 0) {
      saveObs$.push(of(true));
    }

    return combineLatest(saveObs$);
  }

  onSaveStudyCtu() {
    this.spinner.show();

    if (this.isFormValid()) {
      const studyId = this.form.value?.studyCTUs[0]?.study?.id;
      const scId = this.form.value?.studyCTUs[0]?.studyCountry?.id;

      if (scId && studyId) {
        this.onSave(scId, studyId).subscribe((success) => {
          this.spinner.hide();
          if (success.every(s => s)) {
            this.toastr.success('Changes saved successfully');
            this.router.navigate([`/study-ctus/${this.id}/view`]);
          }
        });
      } else {
        this.spinner.hide();
        this.toastr.error("Couldn't get study and/or study country ID from study CTU");
      }
    } else {
      this.spinner.hide();
    }
  }

  private mapExistingCtuToDisplayedCtu(ctu: any): any {
    if (!ctu) {
      return ctu;
    }

    const sharePointMatch = this.ctuMapperService.mapExistingCtuToDisplayedCtu(ctu, this.sharePointCtus, this.countries);

    if (sharePointMatch && (sharePointMatch?.sharepointItemId || sharePointMatch?.source === 'sharepoint')) {
      return sharePointMatch;
    }

    return ctu;
  }

  private getSharePointVersionOfCtu(ctu: any): any {
    if (!ctu) {
      return null;
    }

    if (ctu?.sharepointItemId || ctu?.source === 'sharepoint') {
      return ctu;
    }

    const match = this.sharePointCtus?.find((spCtu: any) => {
      return this.ctuMapperService.compareCtuOptions(ctu, spCtu, this.countries);
    });


    return match || null;
  }

  dateToString(date) {
    return dateToString(date);
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }

  compareCtuOptions = (a: any, b: any): boolean => {
    return this.ctuMapperService.compareCtuOptions(a, b, this.countries);
  };

  searchCTUs = (term: string, item: any) => {
    return this.ctuMapperService.searchCTUs(term, item);
  };

  back(): void {
    this.backService.back();
  }
}