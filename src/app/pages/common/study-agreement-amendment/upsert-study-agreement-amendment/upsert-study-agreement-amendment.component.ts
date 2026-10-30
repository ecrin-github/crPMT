import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { StudyAgreementAmendmentInterface } from 'src/app/_rms/interfaces/core/study-agreement-amendment.interface';
import { StudyAgreementAmendmentService } from 'src/app/_rms/services/entities/study-agreement-amendment/study-agreement-amendment.service';
import { dateToString, getTodayNgbDate, stringToDate } from 'src/assets/js/util';

@Component({
  selector: 'app-upsert-study-agreement-amendment',
  templateUrl: './upsert-study-agreement-amendment.component.html',
  styleUrls: ['./upsert-study-agreement-amendment.component.scss']
})
export class UpsertStudyAgreementAmendmentComponent implements OnInit {
  @Input() studyAgreementAmendments: StudyAgreementAmendmentInterface[];
  // The parent agreement's start date, so a new end date can't be set before it
  @Input() agreementStartDate: NgbDateStruct;

  // A contract can't be signed in the future
  today: NgbDateStruct = getTodayNgbDate();

  // Whether each amendment (by index) changes the agreement's end date - drives the "new end date" yes/no toggle
  changesEndDate: boolean[] = [];

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

  form: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  submitted: boolean = false;

  constructor(
    private studyAgreementAmendmentService: StudyAgreementAmendmentService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      studyAgreementAmendments: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get fv() { return this.getAmendmentsForm()?.value; }

  getAmendmentsForm(): UntypedFormArray {
    return this.form.get('studyAgreementAmendments') as UntypedFormArray;
  }

  newAmendment(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      signedBySponsorDate: null,
      signedByEcrinDate: null,
      newEndDate: null,
      studyAgreement: null,
    }, { validators: [this.newEndDateValidatorFn] });
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.studyAgreementAmendments.forEach((amendment: StudyAgreementAmendmentInterface, index) => {
      formArray.push(this.fb.group({
        id: amendment.id,
        signedBySponsorDate: stringToDate(amendment.signedBySponsorDate),
        signedByEcrinDate: stringToDate(amendment.signedByEcrinDate),
        newEndDate: stringToDate(amendment.newEndDate),
        studyAgreement: amendment.studyAgreement,
      }, { validators: [this.newEndDateValidatorFn] }));
    });
    return formArray;
  }

  patchForm() {
    this.form.setControl('studyAgreementAmendments', this.getFormArray());

    // Restoring the yes/no toggle based on whether a new end date was already set
    this.changesEndDate = this.studyAgreementAmendments.map((amendment) => !!amendment.newEndDate);
  }

  addAmendment() {
    this.getAmendmentsForm().push(this.newAmendment());
    this.changesEndDate.push(false);
  }

  removeAmendment(i) {
    this.getAmendmentsForm().removeAt(i);
    // Removing a row doesn't make the form dirty, needed for the unsaved changes popup (#6)
    this.getAmendmentsForm().markAsDirty();
    this.changesEndDate.splice(i, 1);
  }

  onChangeEndDateToggle(i: number) {
    if (!this.changesEndDate[i]) { // Switched back to "No": clearing the stale date so it isn't saved
      this.getAmendmentsForm().at(i).get('newEndDate').setValue(null);
      // The toggle isn't part of the form: marking the date as changed for the unsaved changes popup (#6)
      this.getAmendmentsForm().at(i).get('newEndDate').markAsDirty();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.studyAgreementAmendments) {
      if (!this.studyAgreementAmendments) {
        this.studyAgreementAmendments = [];
      }
      this.patchForm();
    }

    if (changes.agreementStartDate && !changes.agreementStartDate.firstChange) {
      // Re-check newEndDate vs. the agreement's start date if it changes after the amendments were loaded
      this.getAmendmentsForm()?.controls.forEach((group) => group.updateValueAndValidity());
    }
  }

  isFormValid() { // TODO?
    this.submitted = true;

    return this.form.valid;
  }

  updatePayload(payload, saId, i) {
    payload.studyAgreement = saId;

    payload.signedBySponsorDate = this.dateToString(payload.signedBySponsorDate);
    payload.signedByEcrinDate = this.dateToString(payload.signedByEcrinDate);
    payload.newEndDate = this.dateToString(payload.newEndDate);

    payload.order = i;
  }

  onSave(saId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));

    // One bulk query for the added items and one for the edited items, instead of one query per item (#18)
    const addPayload = [];
    const editPayload = [];

    for (const [i, item] of payload.studyAgreementAmendments.entries()) {
      this.updatePayload(item, saId, i);

      if (!item.id) { // Add
        addPayload.push(item);
      } else {  // Edit
        editPayload.push(item);
      }
    }

    if (addPayload.length > 0) {
      saveObs$.push(this.studyAgreementAmendmentService.addStudyAgreementAmendments(addPayload).pipe(
        mergeMap((res: any) => {
          if (res.status === 201) {
            return of(true);
          }
          this.toastr.error("Failed to save Study Agreement Amendment");
          return of(false);
        }), catchError(err => {
          this.toastr.error(err?.message, "Failed to save Study Agreement Amendment");
          return of(false);
        })
      ));
    }

    if (editPayload.length > 0) {
      saveObs$.push(this.studyAgreementAmendmentService.editStudyAgreementAmendments(editPayload).pipe(
        mergeMap((res: any) => {
          if (res.status === 200) {
            return of(true);
          }
          this.toastr.error("Failed to save Study Agreement Amendment");
          return of(false);
        }), catchError(err => {
          this.toastr.error(err?.message, "Failed to save Study Agreement Amendment");
          return of(false);
        })
      ));
    }

    // Deleting items deleted in the UI
    const formItemIds: Set<String> = new Set(payload.studyAgreementAmendments.map((item: StudyAgreementAmendmentInterface) => { return item.id; }));
    const removedIds: Array<number> = this.studyAgreementAmendments.filter((initialItem) => !formItemIds.has(initialItem.id)).map((item) => Number(item.id));

    if (removedIds.length > 0) {
      saveObs$.push(this.studyAgreementAmendmentService.deleteStudyAgreementAmendments(removedIds).pipe(
        mergeMap((res: any) => {
          if (res.status === 204) {
            return of(true);
          }
          this.toastr.error("Failed to delete Study Agreement Amendment");
          return of(false);
        }), catchError(err => {
          this.toastr.error(err?.message, "Failed to delete Study Agreement Amendment");
          return of(false);
        })
      ));
    }

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
