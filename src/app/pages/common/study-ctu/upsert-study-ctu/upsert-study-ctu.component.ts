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
import { dateToString, getFlagEmoji, getTagBgColor, getTagBorderColor, getYYYYMMDDFromDateString } from 'src/assets/js/util';
import { UpsertCentreComponent } from '../../centre/upsert-centre/upsert-centre.component';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { UpsertCtuAgreementComponent } from '../../ctu-agreement/upsert-ctu-agreement/upsert-ctu-agreement.component';
import { CtuEvaluationResults, ctuEvaluationsListUrl } from 'src/assets/js/constants';

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

  sharePointCtus: any[] = [];
  dbCtus: CTUInterface[] = [];
  countries: CountryInterface[] = [];
  services: ClassValueInterface[] = [];
  studyCTUs: StudyCTUInterface[] = [];
  ctuEvaluations: any[] = [];
  loadingCTUEvaluations = false;

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
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      studyCTUs: this.fb.array([])
    });
  }

  ngOnInit(): void {
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

    const queryFuncs: Array<Observable<any>> = [];

    if (this.isSctuPage && !this.isAdd) {
      queryFuncs.push(this.getStudyCTU(this.id));
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

    this.contextService.ctus.subscribe((ctus) => {
      this.dbCtus = ctus || [];

      // // Fallback to DB CTUs if SharePoint data is unavailable.
      if ((!this.sharePointCtus || this.sharePointCtus.length === 0) && this.dbCtus.length > 0) {
        this.sharePointCtus = [...this.dbCtus];
        this.sortCTUs();
      }
    });

    this.contextService.countries.subscribe((countries) => {
      this.countries = countries || [];
    });

    this.graphApi.ctusServiceProviders$.subscribe((ctus) => {
      console.log('SharePoint CTUs =', ctus);
      console.log('DB CTUs =', this.dbCtus);
      if (ctus?.length > 0) {
        this.sharePointCtus = [...ctus];
      } else {
        this.sharePointCtus = [...this.dbCtus];
      }

      if (this.sharePointCtus?.length > 0) {
        this.sortCTUs();
      }
    });

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
        ctu: sctu.ctu,
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

    if (!countryISO2 || !this.sharePointCtus?.length) {
      return;
    }

    const { compare } = Intl.Collator('en-GB');

    this.sharePointCtus.sort((a, b) => {
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

  private normalizeText(value: string): string {
    return value?.toLowerCase()?.trim() || '';
  }

  private findCountryIso2FromSharePoint(selectedCtu: any): string | null {
    const rawIso2 = this.normalizeText(selectedCtu?.country?.iso2);
    const rawName = this.normalizeText(selectedCtu?.country?.name);

    const iso3ToIso2Map: Record<string, string> = {
      aut: 'AT',
      bel: 'BE',
      bgr: 'BG',
      hrv: 'HR',
      cyp: 'CY',
      cze: 'CZ',
      dnk: 'DK',
      est: 'EE',
      fin: 'FI',
      fra: 'FR',
      deu: 'DE',
      grc: 'GR',
      hun: 'HU',
      irl: 'IE',
      ita: 'IT',
      lva: 'LV',
      ltu: 'LT',
      lux: 'LU',
      mlt: 'MT',
      nld: 'NL',
      pol: 'PL',
      prt: 'PT',
      rou: 'RO',
      svk: 'SK',
      svn: 'SI',
      esp: 'ES',
      swe: 'SE',
      che: 'CH',
      nor: 'NO',
      isl: 'IS',
      gbr: 'GB'
    };

    if (!rawIso2 && !rawName) {
      return null;
    }

    // 1. direct ISO2
    const directIso2Match = this.countries.find((country) => {
      const iso2 = this.normalizeText(country?.iso2);
      return iso2 === rawIso2 || iso2 === rawName;
    });

    if (directIso2Match?.iso2) {
      return directIso2Match.iso2;
    }

    // 2. ISO3 -> ISO2
    const iso3Candidate = rawIso2 || rawName;
    const convertedIso2 = iso3ToIso2Map[iso3Candidate];

    if (convertedIso2) {
      const iso2Match = this.countries.find((country) => {
        return this.normalizeText(country?.iso2) === this.normalizeText(convertedIso2);
      });

      if (iso2Match?.iso2) {
        return iso2Match.iso2;
      }
    }

    // 3. by country name
    const byNameMatch = this.countries.find((country) => {
      const name = this.normalizeText(country?.name);
      return name === rawIso2 || name === rawName;
    });

    return byNameMatch?.iso2 || null;
  }

  resolveCtuId(selectedCtu): Observable<number | null> {
    if (selectedCtu?.id) {
      return of(selectedCtu.id);
    }

    const shortName = this.normalizeText(selectedCtu?.shortName);
    const name = this.normalizeText(selectedCtu?.name);
    const countryIso2 = this.findCountryIso2FromSharePoint(selectedCtu);

    const existing = this.dbCtus.find((dbCtu) => {
      const dbCountryIso2 = this.normalizeText(dbCtu?.country?.iso2);
      const dbShortName = this.normalizeText(dbCtu?.shortName);
      const dbName = this.normalizeText(dbCtu?.name);

      const sameCountry = dbCountryIso2 === this.normalizeText(countryIso2);
      const sameShortName = !!shortName && dbShortName === shortName;
      const sameName = !!name && dbName === name;

      return sameCountry && (sameShortName || sameName);
    });

    if (existing?.id) {
      console.log('Matched existing CTU in DB:', existing);
      return of(existing.id);
    }

    const payload = {
      shortName: selectedCtu?.shortName || null,
      name: selectedCtu?.name || null,
      country: countryIso2
    };

    console.log('CTU create payload =', payload);
    console.log('selectedCtu =', selectedCtu);

    if (!payload.country) {
      this.toastr.error('Unable to map CTU country from SharePoint to database country.');
      return of(null);
    }

    return this.contextService.addCTU(payload).pipe(
      map((res: any) => {
        console.log('CTU created =', res);
        return res?.id || null;
      }),
      catchError((err) => {
        console.log('CTU create error =', err);
        console.log('CTU create error body =', err?.error);
        this.toastr.error('Failed to create CTU');
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
      if (this.sharePointCtus?.length > 0) {
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
      for (let i = 0; i < payload.services.length; i++) {
        if (payload.services[i]?.id) {
          payload.services[i] = payload.services[i].id;
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
            if (!ctuId) {
              return of(false);
            }

            item.ctu = { id: ctuId };
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

  dateToString(date) {
    return dateToString(date);
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }

  compareCtuOptions = (a: any, b: any): boolean => {
    if (!a || !b) {
      return a === b;
    }

    if (a.id && b.id) {
      return a.id === b.id;
    }

    const aShort = this.normalizeText(a.shortName);
    const bShort = this.normalizeText(b.shortName);
    const aName = this.normalizeText(a.name);
    const bName = this.normalizeText(b.name);
    const aCountry = this.normalizeText(a?.country?.iso2 || a?.country?.name);
    const bCountry = this.normalizeText(b?.country?.iso2 || b?.country?.name);

    return aCountry === bCountry && ((aShort && aShort === bShort) || (aName && aName === bName));
  };

  searchCTUs = (term: string, item: any) => {
    const q = this.normalizeText(term);
    const shortName = this.normalizeText(item?.shortName);
    const name = this.normalizeText(item?.name);
    const country = this.normalizeText(item?.country?.name || item?.country?.iso2);

    return shortName.includes(q) || name.includes(q) || country.includes(q);
  };

  back(): void {
    this.backService.back();
  }
}