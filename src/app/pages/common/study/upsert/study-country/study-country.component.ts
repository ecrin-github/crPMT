import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { StudyCountryInterface } from 'src/app/_rms/interfaces/study/study-country.interface';
import { StudyLookupService } from 'src/app/_rms/services/entities/study-lookup/study-lookup.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';

@Component({
  selector: 'app-study-country',
  templateUrl: './study-country.component.html',
  styleUrls: ['./study-country.component.scss']
})
export class StudyCountryComponent implements OnInit {
  form: UntypedFormGroup;
  countries = ["France", "Spain", "Switzerland", "Italy", "Belgium", "Netherlands", "Poland", "Hungary", "Slovakia", "Czechia", "Norway", "Ireland", "Germany"];
  subscription: Subscription = new Subscription();
  arrLength = 0;
  len: any;
  submitted: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;

  @Input() studyCountriesData: Array<StudyCountryInterface>;

  studyCountries = [];


  constructor(
    private fb: UntypedFormBuilder, 
    private router: Router,
    private studyService: StudyService, 
    private studyLookupService: StudyLookupService, 
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

  get g() { return this.form.controls; }

  getStudyCountriesForm(): UntypedFormArray {
    return this.form.get('studyCountries') as UntypedFormArray;
  }

  newStudyCountry(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      study: '',
      country: '',
      leadCountry: false,
      submissionDate: null,
      approvalDate: null,
      alreadyExists: false
    });
  }

  // getStudyCountries(studyId) {
  //   this.studyService.getStudyCountries(studyId).subscribe((res: any) => {
  //     if (res) {
  //       this.studyCountries = res;
  //       this.patchForm();
  //     }
  //   }, error => {
  //     this.toastr.error(error.error.title);
  //   })
  // }

  patchForm() {
    this.form.setControl('studyCountries', this.patchArray());
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.studyCountries.forEach(sc => {
      formArray.push(this.fb.group({
        id: sc.id,
        study: sc.study ? sc.study.id : null,
        country: sc.country,
        leadCountry: sc.leadCountry,
        submissionDate: sc.submissionDate ? stringToDate(sc.submissionDate) : null,
        approvalDate: sc.approvalDate ? stringToDate(sc.approvalDate) : null,
        alreadyExists: true
      }))
    });
    return formArray;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.studyCountriesData?.currentValue?.length > 0) {
      this.studyCountries = this.studyCountriesData;
      // this.studyId = this.studyCountriesData[0].study.id;
      this.patchForm();
    }
  }

  addStudyCountry() {
    this.getStudyCountriesForm().push(this.newStudyCountry());
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
  }

  onSave(studyId: string) {
    this.submitted = true;
    
    let saveObs$ = [];

    JSON.parse(JSON.stringify(this.form.value.studyCountries)).forEach(item => {
      this.updatePayload(item, studyId);
      if (item.alreadyExists) {
        saveObs$.push(this.studyService.editStudyCountry(item.id, studyId, item));
      } else {
        saveObs$.push(this.studyService.addStudyCountry(studyId, item));
      }
    });

    return combineLatest(saveObs$);
  }
  
  // addStudyCountries() {
  //   /* Add countries to study object in DB */
  //   let saveObs$ = [];
  //   JSON.parse(JSON.stringify(this.form.value.studyCountries)).forEach(item => {
  //     this.updatePayload(item);
  //     if (item.alreadyExists) {
  //       saveObs$.push(this.studyService.addStudyCountry(this.studyId, item));
  //     } else {
  //       saveObs$.push(this.studyService.editStudyCountry(item.id, this.studyId, item));
  //     }
  //   });

  //   combineLatest(saveObs$).subscribe(combRes => {
  //     combRes.forEach((res: any, idx: number) => {
  //       if (res.statusCode === 201) {
  //         this.toastr.success(`Study Country "${res.country}" added successfully`);
  //       } else {
  //         this.toastr.error(res.messages[0]);
  //       }
  //     }, error => {
  //       this.toastr.error(error.error.title);
  //     });

  //     (this.form.get('studyCountries') as UntypedFormArray).clear();
  //     this.getStudyCountries();
  //     this.spinner.hide();
  //   });
  // }

  // editStudyCountries() {
  //   /* Edit countries of study object in DB */
  //   JSON.parse(JSON.stringify(this.form.value.studyCountries)).forEach(item => {
  //     this.updatePayload(item);
  //     this.studyService.editStudyCountry(item.id, item.studyId, item).subscribe((res: any) => {
  //       this.spinner.hide();

  //       if (res.statusCode === 200) {
  //         this.toastr.success(`Study Country "${res.country}" updated successfully`, '');
  //       } else {
  //         this.toastr.error(res.messages[0]);
  //       }
  //       this.isAdd = false;
  //     }, error => {
  //       this.spinner.hide();
  //       this.toastr.error(error.error.title);
  //     });
  //   });
  // }

  // compareFeatVals(fv1: StudyCountryValueInterface, fv2: StudyCountryValueInterface): boolean {
  //   return fv1?.id == fv2?.id;
  // }

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
