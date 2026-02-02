import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { VisitInterface } from 'src/app/_rms/interfaces/core/visit.interface';
import { VisitService } from 'src/app/_rms/services/entities/visit/visit.service';
import { TIME_UNITS, VisitTypeCodes } from 'src/assets/js/constants';
import { dateToString, stringToDate } from 'src/assets/js/util';

@Component({
  selector: 'app-upsert-visit',
  templateUrl: './upsert-visit.component.html',
  styleUrls: ['./upsert-visit.component.scss']
})
export class UpsertVisitComponent implements OnInit {
  VisitTypeCodes = VisitTypeCodes;
  TIME_UNITS: String[] = TIME_UNITS;

  @Input() visits: VisitInterface[];
  @Input() visitTypeCode: string;

  form: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  submitted: boolean = false;
  maxCharsBeforeTruncate: number = 60;
  reportSent: boolean[] = [];
  truncate: boolean[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private visitService: VisitService,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      visits: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get fv() { return this.getVisitsForm()?.value; }

  getVisitsForm(): UntypedFormArray {
    return this.form.get('visits') as UntypedFormArray;
  }

  newVisit(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      visitType: this.visitTypeCode,
      visitDate: null,
      pharmacy: null,
      duration: null,
      durationUnit: null,
      comment: null,
      reportSent: false,
      reportSentDate: null,
      reportApproved: false,
      reportApprovedDate: null,
      centre: null,
    });
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.visits.forEach((v, index) => {
      formArray.push(this.fb.group({
        id: v.id,
        visitType: this.visitTypeCode,
        visitDate: v.visitDate ? this.stringToDate(v.visitDate) : null,
        pharmacy: v.pharmacy,
        duration: v.duration,
        durationUnit: v.durationUnit,
        comment: v.comment,
        reportSent: v.reportSent,
        reportSentDate: v.reportSentDate ? this.stringToDate(v.reportSentDate) : null,
        reportApproved: v.reportApproved,
        reportApprovedDate: v.reportApprovedDate ? this.stringToDate(v.reportApprovedDate) : null,
        centre: null,
      }));
    });
    return formArray;
  }

  patchForm() {
    this.form.setControl('visits', this.getFormArray());

    // SIV and COV components should have exactly 1 visit item at all times
    if (this.fv.length === 0 && (this.visitTypeCode === VisitTypeCodes.SIV || this.visitTypeCode === VisitTypeCodes.COV)) {
      this.addVisit();
    }

    // Setting initial boolean variables to display or not certain fields
    for (let i = 0; i < this.fv.length; i++) {
      this.onChangeReportSent(i);
      this.setInitialTruncate(i);
    }
  }

  addVisit() {
    this.getVisitsForm().push(this.newVisit());
  }

  removeVisit(i: number) {
    this.getVisitsForm().removeAt(i);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.visits) {
      if (!this.visits) {
        this.visits = [];
      }
      this.patchForm();
    }
  }

  isFormValid() { // TODO?
    this.submitted = true;

    return this.form.valid;
  }

  updatePayload(payload, cId, i) {
    payload.centre = cId;

    if (payload.visitDate) {
      payload.visitDate = this.dateToString(payload.visitDate);
    }

    if (payload.reportSentDate) {
      payload.reportSentDate = this.dateToString(payload.reportSentDate);
    }

    if (payload.reportApprovedDate) {
      payload.reportApprovedDate = this.dateToString(payload.reportApprovedDate);
    }

    payload.order = i;
  }

  onSave(cId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));

    // Add/edit visits
    for (const [i, item] of payload.visits.entries()) {
      this.updatePayload(item, cId, i);

      let centreObs$: Observable<Object> = null;
      if (!item.id) { // Add
        centreObs$ = this.visitService.addVisitFromCentre(cId, item);
      } else {
        centreObs$ = this.visitService.editVisit(item.id, item);
      }

      saveObs$.push(centreObs$.pipe(
        mergeMap((res: any) => {
          if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
            return of(true);
          }
          return of(false);
        })
      ));
    }

    // Deleting visits deleted in the UI
    const formVIds: Set<String> = new Set(payload.visits.map((item: VisitInterface) => { return item.id; }));
    const removedVisits: Array<VisitInterface> = this.visits.filter((initialSc) => !formVIds.has(initialSc.id));

    removedVisits.forEach((v) => {
      saveObs$.push(this.visitService.deleteVisit(v.id).pipe(
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

  onChangeReportSent(i) {
    if (this.fv[i].reportSent) {
      this.reportSent[i] = true;
    } else {
      this.reportSent[i] = false;
    }
  }

  setInitialTruncate(i) {
    if (this.fv[i]?.comment?.length > this.maxCharsBeforeTruncate) {
      this.truncate[i] = true;
    } else {
      this.truncate[i] = false;
    }
  }

  setTruncate(i) {
    if (!this.truncate[i]) {
      this.truncate[i] = true;
    } else {
      this.truncate[i] = false;
    }
  }

  displayComment(i, comment) {
    if (this.truncate[i]) {
      return comment.slice(0, this.maxCharsBeforeTruncate) + "...";
    }
    return comment;
  }
}
