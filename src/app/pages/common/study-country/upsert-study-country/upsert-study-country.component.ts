import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { dateToString } from 'src/assets/js/util';
import { StudyCountryInterface } from 'src/app/_rms/interfaces/study/study-country.interface';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, mergeMap } from 'rxjs/operators';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { UpsertStudyCtuComponent } from '../../study-ctu/upsert-study-ctu/upsert-study-ctu.component';
import { StudyCountryService } from 'src/app/_rms/services/entities/study-country/study-country.service';
import { BackService } from 'src/app/_rms/services/back/back.service';

@Component({
  selector: 'app-upsert-study-country',
  templateUrl: './upsert-study-country.component.html',
  styleUrls: ['./upsert-study-country.component.scss']
})
export class UpsertStudyCountryComponent implements OnInit {
  @ViewChildren('studyCTUs') studyCTUComponents: QueryList<UpsertStudyCtuComponent>;
  @Input() studyCountriesData: Array<StudyCountryInterface>;
  @Input() studyId: string;

  id: string;
  form: UntypedFormGroup;
  subscription: Subscription = new Subscription();
  arrLength = 0;
  hovered: boolean = false;
  len: any;
  submitted: boolean = false;
  isAdd: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  isSCPage: boolean = false;
  leadCountryInd: number = -1;
  countries: CountryInterface[] = [];
  studyCountries = [];

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private studyService: StudyService, 
    private studyCountryService: StudyCountryService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService, 
    private contextService: ContextService,
    private backService: BackService,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      studyCountries: this.fb.array([])
    });
  }

  ngOnInit(): void {
    if (this.router.url.includes('study-countries')) {
      this.id = this.activatedRoute.snapshot.params.id;
      this.isSCPage = true;
    }
    
    if (this.isSCPage) {
      setTimeout(() => {
        this.spinner.show();
      });
    }

    this.isAdd = this.router.url.includes('add');
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');

    let queryFuncs: Array<Observable<any>> = [];

    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries
    if (this.isSCPage && !this.isAdd) {
      queryFuncs.push(this.getStudyCountry(this.id));
    }

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error)))));
    });

    combineLatest(obsArr).subscribe(res => {
      if (this.isSCPage && !this.isAdd) {
        this.setStudyCountry(res.pop());
      }

      setTimeout(() => {
        this.spinner.hide();
      });
    });

    this.contextService.countries.subscribe((countries) => {
      this.countries = countries;
    });
  }

  get g() { return this.form.get('studyCountries')["controls"]; }

  getControls(i) {
    return this.form.get('studyCountries')["controls"][i].controls;
  }

  getStudyCountriesForm(): UntypedFormArray {
    return this.form.get('studyCountries') as UntypedFormArray;
  }

  newStudyCountry(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      study: null,
      country: [null, Validators.required],
      leadCountry: false,
      studyCTUs: null
    });
  }

  getStudyCountry(id) {
    return this.studyCountryService.getStudyCountry(id);
  }

  setStudyCountry(scData) {
    if (scData) {
      this.studyCountries = [scData];
      this.id = scData.id;
      this.patchForm();
    }
  }

  patchForm() {
    this.form.setControl('studyCountries', this.patchArray());
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.studyCountries.forEach((sc, index) => {
      formArray.push(this.fb.group({
        id: sc.id,
        study: sc.study,
        country: [sc.country, [Validators.required]],
        leadCountry: sc.leadCountry,
        // Note: unknown why this array needs to be wrapped in another array
        studyCTUs: [sc.studyCtus]
      }))

      if (sc.leadCountry) {
        this.leadCountryInd = index;
      }
    });
    return formArray;
  }

  onChangeCountry(i) {
    // TODO: this function needs comments
    let existingSC = null;
    for (const sc of this.studyCountries) {
      if (sc?.country?.iso2 === this.g[i].value?.country?.iso2) {
        existingSC = sc;
        existingSC['studyCTUs'] = existingSC['studyCtus'];
        delete existingSC['studyCtus'];
        break;
      }
    }

    if (existingSC) {
      delete existingSC["order"];
      this.getStudyCountriesForm().at(i).setValue(existingSC);
    } else {
      const country = this.g[i].value.country;
      this.g[i].reset();
      this.getStudyCountriesForm().at(i).patchValue({country: country});
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.studyCountriesData?.currentValue?.length > 0) {
      this.studyCountries = this.studyCountriesData;
      this.patchForm();
    }
  }

  getTotalNumberOfSites() {
    return "Coming soon!"
  }

  addStudyCountry() {
    this.getStudyCountriesForm().push(this.newStudyCountry());
  }

  removeStudyCountry(i: number) {
    const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
    removeModal.componentInstance.itemType = "study country";

    removeModal.result.then((remove) => {
      if (remove) {
        const scId = this.getStudyCountriesForm().value[i].id;
        if (!scId) { // Study country has been locally added only
          this.getStudyCountriesForm().removeAt(i);
        } else {  // Existing study country
          this.studyService.deleteStudyCountry(this.studyId, scId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getStudyCountriesForm().removeAt(i);

              // Removing study country from studyCountries list, otherwise there will be a failing API call to delete it on save
              this.studyCountries = this.studyCountries.filter((item:any) => item.id != scId);
              this.toastr.success('Study country deleted successfully');
            } else {
              this.toastr.error('Error when deleting study country', res.statusText);
            }
          }, error => {
            this.toastr.error(error.error.title);
          })
        }
      }
    }, error => {});
  }

  formValid() {
    this.submitted = true;
    
    // Manually checking country field (shouldn't be empty)
    for (const i in this.form.get("studyCountries")['controls']) {
      if (this.form.get("studyCountries")['controls'][i].value.country == null) {
        this.form.get("studyCountries")['controls'][i].controls.country.setErrors({'required': true});
      }
    }

    return this.form.valid && !this.studyCTUComponents.some(b => !b.formValid());
  }

  updatePayload(payload, studyId, i) {
    payload.study = studyId;

    if (payload.studyCountry?.id) {
      payload.studyCountry = payload.studyCountry.id;
    }

    if (payload.country?.id) {
      payload.country = payload.country.id;
    }

    payload.order = i;
  }

  onSave(studyId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    // Used to check for study countries that have been "soft deleted" from the interface, 
    // as in by switching country for an existing study country rather than deleting the study country and making a new one
    const scIds: Array<Number> = this.studyCountries.map((item: StudyCountryInterface) => {return item.id;});

    const payload = JSON.parse(JSON.stringify(this.form.value));

    for (const [i, item] of payload.studyCountries.entries()) {
      this.updatePayload(item, studyId, i);
      if (!item.id) {  // Add

        saveObs$.push(this.studyService.addStudyCountry(studyId, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 201) {
              return this.studyCTUComponents.get(i).onSave(res.id, studyId).pipe(
                mergeMap((success) => {
                  if (success) {
                    return of(true);
                  }
                  return of(false);
                })
              );
            }
            return of(false);
          })
        ));
      } else {  // Edit
        // See comment above
        const index = scIds.indexOf(item.id, 0);
        if (index > -1) {
          scIds.splice(index, 1);
        }

        const sctuObs$ = this.studyCTUComponents.get(i).onSave(item.id, item.study).pipe(
          mergeMap((successArr: boolean[]) => {
            const success: boolean = successArr.every(b => b);
            if (!success) {
              this.toastr.error('Failed to update study CTUs');
            }
            return of(success);
          })
        );

        saveObs$.push(sctuObs$);

        // TODO: don't do editObs if sctuObs$ false?
        
        const scObs$ = this.studyService.editStudyCountry(studyId, item.id, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              // this.reuseService.notifyComponents();
              return of(true);
            } else {
              this.toastr.error(res.detail);
              return of(false);
            }
          }), catchError(err => {
            this.toastr.error(err);
            return of(false);
          })
        );

        saveObs$.push(scObs$);
      }
    }

    scIds.forEach((scId) => {
      saveObs$.push(this.studyService.deleteStudyCountry(this.studyId, scId).pipe(
        mergeMap((res: any) => {
          if (res.status === 204) {
            return of(true);
          } else {
            this.toastr.error(res);
            return of(false);
          }
        }), catchError(err => {
          this.toastr.error(err);
          return of(false);
        }))
      );
    });

    if (saveObs$.length == 0) {
      saveObs$.push(of(true));
    }

    return combineLatest(saveObs$);
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }

  searchCountries(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1;
  }

  onFlagClick(i) {
    if (this.leadCountryInd == i) {
      this.g[i].value.leadCountry = false;
      this.leadCountryInd = -1;
    } else {
      this.g[i].value.leadCountry = true;
      if (this.leadCountryInd != -1) {
        this.g[this.leadCountryInd].value.leadCountry = false;
      }
      this.leadCountryInd = i;
    }
  }

  changeFlag(event) {
    if (event.type == 'mouseover') {
      event.target.classList.add("fa-solid");
      event.target.classList.remove("fa-regular");
    } else {
      event.target.classList.add("fa-regular");
      event.target.classList.remove("fa-solid");
    }
  }

  back(): void {
    this.backService.back();
  }

  dateToString(date) {
    return dateToString(date);
  }

  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('featpanel'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
