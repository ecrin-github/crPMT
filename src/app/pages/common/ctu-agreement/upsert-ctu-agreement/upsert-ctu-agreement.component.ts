import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { CTUAgreementInterface } from 'src/app/_rms/interfaces/core/ctu-agreement.interface';
import { CtuAgreementService } from 'src/app/_rms/services/entities/ctu-agreement/ctu-agreement.service';
import { dateToString, getTodayNgbDate, stringToDate } from 'src/assets/js/util';
import { UpsertCtuAgreementAmendmentComponent } from '../../ctu-agreement-amendment/upsert-ctu-agreement-amendment/upsert-ctu-agreement-amendment.component';

@Component({
  selector: 'app-upsert-ctu-agreement',
  templateUrl: './upsert-ctu-agreement.component.html',
  styleUrls: ['./upsert-ctu-agreement.component.scss']
})
export class UpsertCtuAgreementComponent implements OnInit {
  @ViewChildren('ctuAgreementAmendments') ctuAgreementAmendmentComponents: QueryList<UpsertCtuAgreementAmendmentComponent>;
  @Input() ctuAgreements: CTUAgreementInterface[];

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
    const signedByCtuDate = toDate(group.get('signedByCtuDate')?.value);
    const signedByEcrinDate = toDate(group.get('signedByEcrinDate')?.value);
    const startDate = toDate(group.get('startDate')?.value);
    const endDate = toDate(group.get('endDate')?.value);

    const errors: ValidationErrors = {};

    if (draftSentDate && ((signedByCtuDate && signedByCtuDate < draftSentDate) || (signedByEcrinDate && signedByEcrinDate < draftSentDate))) {
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
    private ctuAgreementService: CtuAgreementService,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      ctuAgreements: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get fv() { return this.getCTUAgreementsForm()?.value; }

  getCTUAgreementsForm(): UntypedFormArray {
    return this.form.get('ctuAgreements') as UntypedFormArray;
  }

  newCTUAgreement(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      // Deprecated fields, kept as silent pass-through (see updatePayload) so a PUT never resets them - #96 replaces this UI
      signed: false,
      ctuStatus: null,
      draftSentDate: null,
      signedByCtuDate: null,
      signedByEcrinDate: null,
      startDate: null,
      endDate: null,
      comment: null,
      studyCtu: null,
      ctuAgreementAmendments: []
    }, { validators: [UpsertCtuAgreementComponent.datesValidatorFn] });
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.ctuAgreements.forEach((ctuAg) => {
      formArray.push(this.fb.group({
        id: ctuAg.id,
        signed: ctuAg.signed,
        ctuStatus: ctuAg.ctuStatus,
        draftSentDate: this.stringToDate(ctuAg.draftSentDate),
        signedByCtuDate: this.stringToDate(ctuAg.signedByCtuDate),
        signedByEcrinDate: this.stringToDate(ctuAg.signedByEcrinDate),
        startDate: this.stringToDate(ctuAg.startDate),
        endDate: this.stringToDate(ctuAg.endDate),
        comment: ctuAg.comment,
        studyCtu: ctuAg?.studyCtu,
        ctuAgreementAmendments: [ctuAg.ctuAgreementAmendments]
      }, { validators: [UpsertCtuAgreementComponent.datesValidatorFn] }));
    });
    return formArray;
  }

  patchForm() {
    this.form.setControl('ctuAgreements', this.getFormArray());

    // For now there is only 1 initial agreement, there might be "other" agreements later
    if (this.fv.length === 0) {
      this.addCTUAgreement();
    }
  }

  addCTUAgreement() {
    this.getCTUAgreementsForm().push(this.newCTUAgreement());
  }

  removeCTUAgreemen(i: number) {
    this.getCTUAgreementsForm().removeAt(i);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.ctuAgreements) {
      if (!this.ctuAgreements) {
        this.ctuAgreements = [];
      }
      this.patchForm();
    }
  }

  isFormValid() {
    this.submitted = true;

    return this.form.valid && !this.ctuAgreementAmendmentComponents.some(b => !b.isFormValid());
  }

  // Contract status is derived, not stored: "in progress" until both signature dates are entered
  isFullyExecuted(agreementValue): boolean {
    return !!(agreementValue?.signedByCtuDate && agreementValue?.signedByEcrinDate);
  }

  contractStatus(agreementValue): string {
    return this.isFullyExecuted(agreementValue) ? 'Fully executed' : 'In progress';
  }

  updatePayload(payload, sctuId, i) {
    payload.studyCtu = sctuId;

    // signed/ctuStatus are deprecated and no longer editable, but must be resent unchanged:
    // this is a PUT and the backend would otherwise reset "signed" to its default (false)
    if (payload.ctuStatus?.id) {
      payload.ctuStatus = payload.ctuStatus.id;
    }

    payload.draftSentDate = this.dateToString(payload.draftSentDate);
    payload.signedByCtuDate = this.dateToString(payload.signedByCtuDate);
    payload.signedByEcrinDate = this.dateToString(payload.signedByEcrinDate);
    payload.startDate = this.dateToString(payload.startDate);
    payload.endDate = this.dateToString(payload.endDate);

    payload.order = i;
  }

  onSave(sctuId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));

    // Add/edit ctu agreements
    for (const [i, item] of payload.ctuAgreements.entries()) {
      this.updatePayload(item, sctuId, i);

      let ctuAgreementObs$: Observable<Object> = null;
      if (!item.id) { // Add
        ctuAgreementObs$ = this.ctuAgreementService.addCTUAgreementFromStudyCTU(sctuId, item);
      } else {
        ctuAgreementObs$ = this.ctuAgreementService.editCTUAgreement(item.id, item);
      }

      saveObs$.push(ctuAgreementObs$.pipe(
        mergeMap((res: any) => {
          if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
            let subObs$: Observable<boolean>[] = [];

            subObs$.push(this.ctuAgreementAmendmentComponents.get(i).onSave(res.id).pipe(
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
          this.toastr.error("Failed to save CTU Agreement");
          return of(false);
        })
      ));
    }

    // Deleting items deleted in the UI
    const formItemIds: Set<String> = new Set(payload.ctuAgreements.map((item: CTUAgreementInterface) => { return item.id; }));
    const removedItems: Array<CTUAgreementInterface> = this.ctuAgreements.filter((initialItem) => !formItemIds.has(initialItem.id));

    removedItems.forEach((item) => {
      saveObs$.push(this.ctuAgreementService.deleteCTUAgreement(item.id).pipe(
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
