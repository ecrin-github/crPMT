import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { CTUAgreementAmendmentInterface } from 'src/app/_rms/interfaces/core/ctu-agreement-amendment.interface';
import { CtuAgreementAmendmentService } from 'src/app/_rms/services/entities/ctu-agreement-amendment/ctu-agreement-amendment.service';
import { dateToString, getTodayNgbDate, stringToDate } from 'src/assets/js/util';

@Component({
  selector: 'app-upsert-ctu-agreement-amendment',
  templateUrl: './upsert-ctu-agreement-amendment.component.html',
  styleUrls: ['./upsert-ctu-agreement-amendment.component.scss']
})
export class UpsertCtuAgreementAmendmentComponent implements OnInit {
  @Input() ctuAgreementAmendments: CTUAgreementAmendmentInterface[];
  // The parent agreement's start date, so a new end date can't be set before it
  @Input() agreementStartDate: NgbDateStruct;

  // A contract can't be signed in the future
  today: NgbDateStruct = getTodayNgbDate();

  // Whether each amendment (by index) changes the agreement's end date - drives the "new end date" yes/no toggle
  changesEndDate: boolean[] = [];

  form: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  submitted: boolean = false;

  // Bound as an instance property (not static) so it can read this.agreementStartDate
  newEndDateValidatorFn: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const toDate = (d: NgbDateStruct) => d?.year && d?.month && d?.day ? new Date(d.year, d.month - 1, d.day) : null;

    const newEndDate = toDate(group.get('newEndDate')?.value);
    const startDate = toDate(this.agreementStartDate);

    if (newEndDate && startDate && newEndDate < startDate) {
      return { newEndDateBeforeStart: true };
    }
    return null;
  }

  constructor(
    private ctuAgreementAmendmentService: CtuAgreementAmendmentService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      ctuAgreementAmendments: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get fv() { return this.getAmendmentsForm()?.value; }

  getAmendmentsForm(): UntypedFormArray {
    return this.form.get('ctuAgreementAmendments') as UntypedFormArray;
  }

  newAmendment(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      signedDate: null, // Deprecated, kept as silent pass-through - #97 replaces this UI
      signedByCtuDate: null,
      signedByEcrinDate: null,
      newEndDate: null,
      ctuAgreement: null,
    }, { validators: [this.newEndDateValidatorFn] });
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.ctuAgreementAmendments.forEach((amendment: CTUAgreementAmendmentInterface) => {
      formArray.push(this.fb.group({
        id: amendment.id,
        signedDate: stringToDate(amendment.signedDate),
        signedByCtuDate: stringToDate(amendment.signedByCtuDate),
        signedByEcrinDate: stringToDate(amendment.signedByEcrinDate),
        newEndDate: stringToDate(amendment.newEndDate),
        ctuAgreement: amendment.ctuAgreement,
      }, { validators: [this.newEndDateValidatorFn] }));
    });
    return formArray;
  }

  patchForm() {
    this.form.setControl('ctuAgreementAmendments', this.getFormArray());

    // Restoring the yes/no toggle based on whether a new end date was already set
    this.changesEndDate = this.ctuAgreementAmendments.map((amendment) => !!amendment.newEndDate);
  }

  addAmendment() {
    this.getAmendmentsForm().push(this.newAmendment());
    this.changesEndDate.push(false);
  }

  removeAmendment(i) {
    this.getAmendmentsForm().removeAt(i);
    this.changesEndDate.splice(i, 1);
  }

  onChangeEndDateToggle(i: number) {
    if (!this.changesEndDate[i]) { // Switched back to "No": clearing the stale date so it isn't saved
      this.getAmendmentsForm().at(i).get('newEndDate').setValue(null);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.ctuAgreementAmendments) {
      if (!this.ctuAgreementAmendments) {
        this.ctuAgreementAmendments = [];
      }
      this.patchForm();
    }

    if (changes.agreementStartDate && !changes.agreementStartDate.firstChange) {
      // Re-check newEndDate vs. the agreement's start date if it changes after the amendments were loaded
      this.getAmendmentsForm()?.controls.forEach((group) => group.updateValueAndValidity());
    }
  }

  isFormValid() {
    this.submitted = true;

    return this.form.valid;
  }

  updatePayload(payload, ctuAgId, i) {
    payload.ctuAgreement = ctuAgId;

    payload.signedDate = this.dateToString(payload.signedDate);
    payload.signedByCtuDate = this.dateToString(payload.signedByCtuDate);
    payload.signedByEcrinDate = this.dateToString(payload.signedByEcrinDate);
    payload.newEndDate = this.dateToString(payload.newEndDate);

    payload.order = i;
  }

  onSave(ctuAgId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));

    // Add/edit amendments
    for (const [i, item] of payload.ctuAgreementAmendments.entries()) {
      this.updatePayload(item, ctuAgId, i);

      let amendmentObs$: Observable<Object> = null;
      if (!item.id) { // Add
        amendmentObs$ = this.ctuAgreementAmendmentService.addAmendmentFromCTUAgreement(ctuAgId, item);
      } else {
        amendmentObs$ = this.ctuAgreementAmendmentService.editCTUAgreementAmendment(item.id, item);
      }

      saveObs$.push(amendmentObs$.pipe(
        mergeMap((res: any) => {
          if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
            return of(true);
          }
          this.toastr.error("Failed to save CTU Agreement Amendment");
          return of(false);
        })
      ));
    }

    // Deleting items deleted in the UI
    const formItemIds: Set<String> = new Set(payload.ctuAgreementAmendments.map((item: CTUAgreementAmendmentInterface) => { return item.id; }));
    const removedItems: Array<CTUAgreementAmendmentInterface> = this.ctuAgreementAmendments.filter((initialItem) => !formItemIds.has(initialItem.id));

    removedItems.forEach((item) => {
      saveObs$.push(this.ctuAgreementAmendmentService.deleteCTUAgreementAmendment(item.id).pipe(
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

  stringToDate(date) {
    return stringToDate(date);
  }

  dateToString(date) {
    return dateToString(date);
  }
}
