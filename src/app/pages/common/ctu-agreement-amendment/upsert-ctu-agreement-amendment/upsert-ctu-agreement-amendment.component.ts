import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { CTUAgreementAmendmentInterface } from 'src/app/_rms/interfaces/core/ctu-agreement-amendment.interface';
import { CtuAgreementAmendmentService } from 'src/app/_rms/services/entities/ctu-agreement-amendment/ctu-agreement-amendment.service';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { AmendmentModalComponent } from '../../amendment-modal/amendment-modal/amendment-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-upsert-ctu-agreement-amendment',
  templateUrl: './upsert-ctu-agreement-amendment.component.html',
  styleUrls: ['./upsert-ctu-agreement-amendment.component.scss']
})
export class UpsertCtuAgreementAmendmentComponent implements OnInit {
  @Input() ctuAgreementAmendments: CTUAgreementAmendmentInterface[];

  form: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  submitted: boolean = false;

  constructor(
    private ctuAgreementAmendmentService: CtuAgreementAmendmentService,
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
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
      signedDate: null,
      ctuAgreement: null,
    });
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.ctuAgreementAmendments.forEach((amendment: CTUAgreementAmendmentInterface, index) => {
      formArray.push(this.fb.group({
        id: amendment.id,
        signedDate: stringToDate(amendment.signedDate),
        ctuAgreement: amendment.ctuAgreement,
      }));
    });
    return formArray;
  }

  patchForm() {
    this.form.setControl('ctuAgreementAmendments', this.getFormArray());
  }

  addAmendment() {
    this.getAmendmentsForm().push(this.newAmendment());
  }

  removeAmendment(i) {
    this.getAmendmentsForm().removeAt(i);
  }

  removeVisit(i: number) {
    this.getAmendmentsForm().removeAt(i);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.ctuAgreementAmendments) {
      if (!this.ctuAgreementAmendments) {
        this.ctuAgreementAmendments = [];
      }
      this.patchForm();
    }
  }

  onClickNewAmendment() {
    this.addAmendment();

    const reminderModal = this.modalService.open(AmendmentModalComponent, { size: 'lg', backdrop: 'static' });
    reminderModal.result.then(() => {});
  }

  isFormValid() { // TODO?
    this.submitted = true;

    return this.form.valid;
  }

  updatePayload(payload, ctuAgId, i) {
    payload.ctuAgreement = ctuAgId;

    payload.signedDate = this.dateToString(payload.signedDate);

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
