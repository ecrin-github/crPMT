import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { ReportingPeriodInterface } from 'src/app/_rms/interfaces/core/reporting-period.interface';
import { ReportingPeriodService } from 'src/app/_rms/services/entities/reporting-period/reporting-period.service';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upsert-reporting-period',
  templateUrl: './upsert-reporting-period.component.html',
  styleUrls: ['./upsert-reporting-period.component.scss']
})
export class UpsertReportingPeriodComponent implements OnInit {
  @Input() reportingPeriodsData: ReportingPeriodInterface[];

  form: UntypedFormGroup;
  reportingPeriods: ReportingPeriodInterface[] = [];
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  submitted: boolean = false;

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private reportingPeriodService: ReportingPeriodService,
    private router: Router,
    private toastr: ToastrService) {
      this.form = this.fb.group({
        reportingPeriods: this.fb.array([])
      });
    }

  ngOnInit(): void {
    // this.form = this.fb.group({
    //   reportingPeriods: this.fb.array([])
    // });

    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get fc() { return this.form.get('reportingPeriods')["controls"]; }
  get fv() { return this.form.get('reportingPeriods')?.value; }

  getReportingPeriodsForm(): UntypedFormArray {
    return this.form.get('reportingPeriods') as UntypedFormArray;
  }

  newReportingPeriod(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      start: null,
      end: null,
      stage: null,
      comment: null,
    });
  }

  patchForm() {
    this.form.setControl('reportingPeriods', this.patchArray());
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.reportingPeriods.forEach((rp, index) => {
      formArray.push(this.fb.group({
        id: rp.id,
        start: rp.start ? stringToDate(rp.start) : null,
        end: rp.end ? stringToDate(rp.end) : null,
        stage: rp.stage,
        comment: rp.comment,
      }));
    });
    return formArray;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.reportingPeriodsData) {
      if (!this.reportingPeriodsData) {
        this.reportingPeriods = [];
      } else {
        this.reportingPeriods = this.reportingPeriodsData;
      }
      this.patchForm();
    }
  }

  addReportingPeriod() {
    this.getReportingPeriodsForm().push(this.newReportingPeriod());
  }

  deleteReportingPeriod(i: number) {
    const rpId = this.fv[i].id;
    if (!rpId) { // Reporting period has been locally added only
      this.getReportingPeriodsForm().removeAt(i);
    } else {  // Existing notification
      const removeModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
      removeModal.componentInstance.setDefaultDeleteMessage("reporting period");

      removeModal.result.then((remove) => {
        if (remove) {
          this.reportingPeriodService.deleteReportingPeriod(rpId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getReportingPeriodsForm().removeAt(i);
              this.toastr.success('Reporting period deleted successfully');
            } else {
              this.toastr.error('Error when deleting reporting period', res.statusText);
            }
          }, error => {
            this.toastr.error(error);
          })
        }
      }, error => { this.toastr.error(error) });
    }
  }

  // TODO?
  formValid() {
    // this.submitted = true;

    // // Manually checking CTU field (shouldn't be empty)
    // for (const i in this.form.get("notifications")['controls']) {
    //   if (this.form.get("notifications")['controls'][i].value.ctu == null) {
    //     this.form.get("notifications")['controls'][i].controls.ctu.setErrors({'required': true});
    //   }
    // }

    return this.form.valid;
  }

  updatePayload(payload, i, projectId) {
    if (payload.start) {
      payload.start = this.dateToString(payload.start);
    }
    if (payload.end) {
      payload.end = this.dateToString(payload.end);
    }

    payload.project = projectId;

    payload.stage = i + 1;
  }

  onSave(projectId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));

    for (const [i, item] of payload.reportingPeriods.entries()) {
      this.updatePayload(item, i, projectId);

      let rpObs$;

      if (!item.id) { // Add
        rpObs$ = this.reportingPeriodService.addReportingPeriod(item);
      } else {  // Edit
        rpObs$ = this.reportingPeriodService.editReportingPeriod(item.id, item);
      }

      saveObs$.push(rpObs$.pipe(
        mergeMap((res: any) => {
          if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
            return of(true);
          }
          return of(false);
        })
      ));
    }

    if (saveObs$.length == 0) {
      saveObs$.push(of(false));
    }

    return combineLatest(saveObs$);
  }

  dateToString(date) {
    return dateToString(date);
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }
}
