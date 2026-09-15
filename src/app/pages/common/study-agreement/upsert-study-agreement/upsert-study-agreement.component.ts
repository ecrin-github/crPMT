import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { StudyAgreementInterface } from 'src/app/_rms/interfaces/core/study-agreement.interface';
import { StudyAgreementService } from 'src/app/_rms/services/entities/study-agreement/study-agreement.service';
import { dateToString, getTodayNgbDate, stringToDate } from 'src/assets/js/util';
import { UpsertStudyAgreementAmendmentComponent } from '../../study-agreement-amendment/upsert-study-agreement-amendment/upsert-study-agreement-amendment.component';

@Component({
  selector: 'app-upsert-study-agreement',
  templateUrl: './upsert-study-agreement.component.html',
  styleUrls: ['./upsert-study-agreement.component.scss']
})
export class UpsertStudyAgreementComponent implements OnInit {
  @ViewChildren('studyAgreementAmendments') studyAgreementAmendmentComponents: QueryList<UpsertStudyAgreementAmendmentComponent>;
  @Input() studyAgreements: StudyAgreementInterface[];

  // A contract can't be signed in the future
  today: NgbDateStruct = getTodayNgbDate();

  form: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  submitted: boolean = false;

  // Cross-field business rules: can't sign before the draft was sent, end date can't be before start date
  static datesValidatorFn: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const toDate = (d: NgbDateStruct) => d?.year && d?.month && d?.day ? new Date(d.year, d.month - 1, d.day) : null;

    const draftSentDate = toDate(group.get('draftSentDate')?.value);
    const signedBySponsorDate = toDate(group.get('signedBySponsorDate')?.value);
    const signedByEcrinDate = toDate(group.get('signedByEcrinDate')?.value);
    const startDate = toDate(group.get('startDate')?.value);
    const endDate = toDate(group.get('endDate')?.value);

    const errors: ValidationErrors = {};

    if (draftSentDate && ((signedBySponsorDate && signedBySponsorDate < draftSentDate) || (signedByEcrinDate && signedByEcrinDate < draftSentDate))) {
      errors.signedBeforeDraftSent = true;
    }

    if (startDate && endDate && endDate < startDate) {
      errors.endBeforeStart = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private studyAgreementService: StudyAgreementService,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      studyAgreements: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get fv() { return this.getStudyAgreementsForm()?.value; }

  getStudyAgreementsForm(): UntypedFormArray {
    return this.form.get('studyAgreements') as UntypedFormArray;
  }

  newStudyAgreement(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      draftSentDate: null,
      signedBySponsorDate: null,
      signedByEcrinDate: null,
      startDate: null,
      endDate: null,
      comment: null,
      study: null,
      studyAgreementAmendments: []
    }, { validators: [UpsertStudyAgreementComponent.datesValidatorFn] });
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.studyAgreements.forEach((sa) => {
      formArray.push(this.fb.group({
        id: sa.id,
        draftSentDate: this.stringToDate(sa.draftSentDate),
        signedBySponsorDate: this.stringToDate(sa.signedBySponsorDate),
        signedByEcrinDate: this.stringToDate(sa.signedByEcrinDate),
        startDate: this.stringToDate(sa.startDate),
        endDate: this.stringToDate(sa.endDate),
        comment: sa.comment,
        study: sa?.study,
        studyAgreementAmendments: [sa.studyAgreementAmendments]
      }, { validators: [UpsertStudyAgreementComponent.datesValidatorFn] }));
    });
    return formArray;
  }

  patchForm() {
    this.form.setControl('studyAgreements', this.getFormArray());

    // For now there is only 1 initial agreement, there might be "other" agreements later
    if (this.fv.length === 0) {
      this.addStudyAgreement();
    }
  }

  addStudyAgreement() {
    this.getStudyAgreementsForm().push(this.newStudyAgreement());
  }

  removeStudyAgreement(i: number) {
    this.getStudyAgreementsForm().removeAt(i);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.studyAgreements) {
      if (!this.studyAgreements) {
        this.studyAgreements = [];
      }
      this.patchForm();
    }
  }

  isFormValid() {
    this.submitted = true;

    return this.form.valid && !this.studyAgreementAmendmentComponents.some(b => !b.isFormValid());
  }

  // Contract status is derived, not stored: "in progress" until both signature dates are entered
  isFullyExecuted(agreementValue): boolean {
    return !!(agreementValue?.signedBySponsorDate && agreementValue?.signedByEcrinDate);
  }

  contractStatus(agreementValue): string {
    return this.isFullyExecuted(agreementValue) ? 'Fully executed' : 'In progress';
  }

  updatePayload(payload, studyId, i) {
    payload.study = studyId;

    payload.draftSentDate = this.dateToString(payload.draftSentDate);
    payload.signedBySponsorDate = this.dateToString(payload.signedBySponsorDate);
    payload.signedByEcrinDate = this.dateToString(payload.signedByEcrinDate);
    payload.startDate = this.dateToString(payload.startDate);
    payload.endDate = this.dateToString(payload.endDate);

    payload.order = i;
  }

  onSave(studyId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));

    // Add/edit study agreements
    for (const [i, item] of payload.studyAgreements.entries()) {
      this.updatePayload(item, studyId, i);

      let studyAgreementObs$: Observable<Object> = null;
      if (!item.id) { // Add
        studyAgreementObs$ = this.studyAgreementService.addStudyAgreementFromStudy(studyId, item);
      } else {
        studyAgreementObs$ = this.studyAgreementService.editStudyAgreement(item.id, item);
      }

      saveObs$.push(studyAgreementObs$.pipe(
        mergeMap((res: any) => {
          if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
            let subObs$: Observable<boolean>[] = [];

            subObs$.push(this.studyAgreementAmendmentComponents.get(i).onSave(res.id).pipe(
              map((successArr: boolean[]) => {
                return successArr.every(a => a);
              })
            ));

            return combineLatest(subObs$).pipe(
              map((successArr: boolean[]) => {
                return successArr.every(a => a);
              })
            );
          }
          this.toastr.error("Failed to save Study Agreement");
          return of(false);
        })
      ));
    }

    // Deleting items deleted in the UI
    const formItemIds: Set<String> = new Set(payload.studyAgreements.map((item: StudyAgreementInterface) => { return item.id; }));
    const removedItems: Array<StudyAgreementInterface> = this.studyAgreements.filter((initialItem) => !formItemIds.has(initialItem.id));

    removedItems.forEach((item) => {
      saveObs$.push(this.studyAgreementService.deleteStudyAgreement(item.id).pipe(
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
