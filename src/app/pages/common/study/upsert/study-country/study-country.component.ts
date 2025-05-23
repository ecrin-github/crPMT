import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { StudyCountryInterface } from 'src/app/_rms/interfaces/study/study-country.interface';
import { StudyLookupService } from 'src/app/_rms/services/entities/study-lookup/study-lookup.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-study-country',
  templateUrl: './study-country.component.html',
  styleUrls: ['./study-country.component.scss']
})
export class StudyCountryComponent implements OnInit {
  @Input() studyCountriesData: Array<StudyCountryInterface>;
  @Input() countries: Array<String>;
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
  studyCountries = [];

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private studyService: StudyService, 
    private spinner: NgxSpinnerService, 
    private toastr: ToastrService) {
    this.form = this.fb.group({
      studyCountries: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get g() { return this.form.get('studyCountries')["controls"]; }

  getControls(i) {
    return this.g[i].controls;
  }

  getStudyCountriesForm(): UntypedFormArray {
    return this.form.get('studyCountries') as UntypedFormArray;
  }

  newStudyCountry(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      study: '',
      country: [null, Validators.required],
      leadCountry: false,
      submissionDate: null,
      approvalDate: null,
      // TODO: instead can be checked if id is set?
      alreadyExists: false
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
        country: sc.country,
        leadCountry: sc.leadCountry,
        submissionDate: sc.submissionDate ? stringToDate(sc.submissionDate) : null,
        approvalDate: sc.approvalDate ? stringToDate(sc.approvalDate) : null,
        alreadyExists: true
      }))

      if (sc.leadCountry) {
        this.leadCountryInd = index;
      }
    });
    return formArray;
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
        if (!scId) { // Studycountry has been locally added only
          this.getStudyCountriesForm().removeAt(i);
        } else {  // Existing study
          this.studyService.deleteStudyCountry(this.studyId, scId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getStudyCountriesForm().removeAt(i);
              this.toastr.success('Study country deleted successfully');
            } else {
              this.toastr.error('Error when deleting study', res.statusText);
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

    return this.form.valid;
  }

  updatePayload(payload, studyId) {
    if (!payload.alreadyExists) {
      payload.study = studyId;
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

    JSON.parse(JSON.stringify(this.form.value.studyCountries)).forEach(item => {
      this.updatePayload(item, studyId);
      if (item.alreadyExists) {
        saveObs$.push(this.studyService.editStudyCountry(studyId, item.id, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              return of(true);
            }
            return of(false);
          })
        ));
      } else {
        saveObs$.push(this.studyService.addStudyCountry(studyId, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              return of(true);
            }
            return of(false);
          })
        ));
      }
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
