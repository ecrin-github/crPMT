import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ClassValueInterface } from 'src/app/_rms/interfaces/context/class-value.interface';
import { CTUAgreementInterface } from 'src/app/_rms/interfaces/core/ctu-agreement.interface';
import { CtuStatusService } from 'src/app/_rms/services/context/ctu-status/ctu-status.service';
import { CtuAgreementService } from 'src/app/_rms/services/entities/ctu-agreement/ctu-agreement.service';
import { compareIds, dateToString, searchClassValues, stringToDate } from 'src/assets/js/util';

@Component({
  selector: 'app-upsert-ctu-agreement',
  templateUrl: './upsert-ctu-agreement.component.html',
  styleUrls: ['./upsert-ctu-agreement.component.scss']
})
export class UpsertCtuAgreementComponent implements OnInit {
  @ViewChildren('ctuAgreementAmendments') ctuAgreementAmendmentComponents: QueryList<UpsertCtuAgreementComponent>;
  @Input() ctuAgreements: CTUAgreementInterface[];

  form: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  submitted: boolean = false;
  agreementSigned: boolean[] = [];
  ctuStatuses: ClassValueInterface[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private ctuAgreementService: CtuAgreementService,
    private ctuStatusService: CtuStatusService,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      ctuAgreements: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');

    this.ctuStatusService.ctuStatuses.subscribe((ctuStatuses) => {
      this.ctuStatuses = ctuStatuses;
    })
  }

  get fv() { return this.getCTUAgreementsForm()?.value; }

  getCTUAgreementsForm(): UntypedFormArray {
    return this.form.get('ctuAgreements') as UntypedFormArray;
  }

  newCTUAgreement(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      signed: false,
      startDate: null,
      endDate: null,
      ctuStatus: null,
      studyCtu: null,
      ctuAgreementAmendments: []
    });
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.ctuAgreements.forEach((ctuAg, index) => {
      formArray.push(this.fb.group({
        id: ctuAg.id,
        signed: ctuAg.signed,
        startDate: this.stringToDate(ctuAg.startDate),
        endDate: this.stringToDate(ctuAg.endDate),
        ctuStatus: ctuAg.ctuStatus,
        studyCtu: ctuAg?.studyCtu,
        ctuAgreementAmendments: [ctuAg.ctuAgreementAmendments]
      }));
    });
    return formArray;
  }

  patchForm() {
    this.form.setControl('ctuAgreements', this.getFormArray());

    // For now there is only 1 regular agreement, there might be "other" agreements later
    if (this.fv.length === 0) {
      this.addCTUAgreement();
    }

    // Setting initial boolean variables to display or not certain fields
    for (let i = 0; i < this.fv.length; i++) {
      this.onChangeAgreementSigned(i);
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

  isFormValid() { // TODO?
    this.submitted = true;

    return this.form.valid;
  }

  updatePayload(payload, sctuId, i) {
    payload.studyCtu = sctuId;

    payload.startDate = this.dateToString(payload.startDate);
    payload.endDate = this.dateToString(payload.endDate);

    if (payload.ctuStatus?.id) {
      payload.ctuStatus = payload.ctuStatus.id;
    }

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

  onChangeAgreementSigned(i) {
    if (this.fv[i].signed) {
      this.agreementSigned[i] = true;
    } else {
      this.agreementSigned[i] = false;
    }
  }

  searchClassValues = (term: string, item) => {
    return searchClassValues(term, item);
  }

  compareIds = (item1, item2) => {
    return compareIds(item1, item2);
  }

  addCTUStatus = (ctuStatus) => {
    return this.ctuStatusService.addCTUStatusDropdown(ctuStatus);
  }

  deleteCTUStatus($event, ctuStatusToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (ctuStatusToRemove.id == -1) { // Created locally by user
      this.ctuStatuses = this.ctuStatuses.filter(c => !(c.id == ctuStatusToRemove.id && c.value == ctuStatusToRemove.value));
    } else {  // Already existing
      this.ctuStatusService.deleteCTUStatusDropdown(ctuStatusToRemove, !this.isAdd);
    }
  }
}
