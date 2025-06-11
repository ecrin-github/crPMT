import { Component, EventEmitter, Input, OnInit, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { StudyCountryInterface } from 'src/app/_rms/interfaces/study/study-country.interface';
import { StudyLookupService } from 'src/app/_rms/services/entities/study-lookup/study-lookup.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { UpsertStudyCtuComponent } from '../../study-ctu/upsert-study-ctu/upsert-study-ctu.component';

@Component({
  selector: 'app-upsert-study-country',
  templateUrl: './upsert-study-country.component.html',
  styleUrls: ['./upsert-study-country.component.scss']
})
export class UpsertStudyCountryComponent implements OnInit {
  @ViewChildren('studyCTUs') studyCTUComponents: QueryList<UpsertStudyCtuComponent>;
  @Input() studyCountriesData: Array<StudyCountryInterface>;
  @Input() studyId: string;

  form: UntypedFormGroup;
  subscription: Subscription = new Subscription();
  arrLength = 0;
  hovered: boolean = false;
  len: any;
  submitted: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  leadCountryInd: number = -1;
  countries: CountryInterface[] = [];
  studyCountries = [];

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private studyService: StudyService, 
    private spinner: NgxSpinnerService, 
    private contextService: ContextService,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      studyCountries: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');

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
      submissionDate: null,
      approvalDate: null,
      studyCTUs: null
    });
  }

  getExistingCountryForm(sc): UntypedFormGroup {
    return this.fb.group({
      id: sc.id,
      study: sc.study,
      country: [sc.country, Validators.required],
      leadCountry: sc.leadCountry,
      submissionDate: sc.submissionDate,
      approvalDate: sc.approvalDate,
      studyCTUs: [sc.studyCtus]
    });
  }

  patchForm() {
    this.form.setControl('studyCountries', this.patchArray());
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.studyCountries.forEach((sc, index) => {
      formArray.push(this.fb.group({
        id: sc.id,
        study: sc.study ? sc.study.id : null,
        country: [sc.country, [Validators.required]],
        leadCountry: sc.leadCountry,
        submissionDate: sc.submissionDate ? stringToDate(sc.submissionDate) : null,
        approvalDate: sc.approvalDate ? stringToDate(sc.approvalDate) : null,
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

              let j = 0;
              let found = false;
              while (j < this.studyCountries.length && !found) {
                if (this.studyCountries[j].id == scId) {
                  found = true;
                } else {
                  j++;
                }
              }
              if (found) {
                this.studyCountries = this.studyCountries.slice(j, 1);
              }
              
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

  updatePayload(payload, studyId) {
    payload.study = studyId;

    if (payload.studyCountry?.id) {
      payload.studyCountry = payload.studyCountry.id;
    }

    if (payload.submissionDate) {
      payload.submissionDate = dateToString(payload.submissionDate);
    }

    if (payload.approvalDate) {
      payload.approvalDate = dateToString(payload.approvalDate);
    }

    if (payload.country?.id) {
      payload.country = payload.country.id;
    }
  }

  onSave(studyId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    // Used to check for study countries that have been "soft deleted" from the interface, 
    // as in by switching country for an existing study country rather than deleting the study country and making a new one
    const scIds: Array<Number> = this.studyCountries.map((item: StudyCountryInterface) => {return item.id;});

    const payload = JSON.parse(JSON.stringify(this.form.value));

    for (const [i, item] of payload.studyCountries.entries()) {
      this.updatePayload(item, studyId);
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

    // if (saveObs$.length > 0) {
    //   return combineLatest(saveObs$).pipe(
    //     map(arr => arr.reduce((acc: boolean, one: boolean) => {
    //       return acc && one;
    //     }, true))
    //   );
    // }

    // return of(true);
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
