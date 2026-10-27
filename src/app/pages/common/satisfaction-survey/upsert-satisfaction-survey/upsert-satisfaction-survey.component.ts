import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { SatisfactionSurveyInterface } from 'src/app/_rms/interfaces/core/satisfaction-survey.interface';
import { SatisfactionSurveyService } from 'src/app/_rms/services/entities/satisfaction-survey/satisfaction-survey.service';
import { SATISFACTION_SURVEY_INTERVAL_MONTHS, SATISFACTION_SURVEY_TYPES } from 'src/assets/js/constants';
import { dateToString, getTodayNgbDate, stringToDate } from 'src/assets/js/util';

/*
 * Business rules (specs L2, issue #120):
 * - The first survey is always the initial survey, the next ones are follow-up surveys sent every 2 years
 * - The end of project survey is necessarily the last one: once chosen, no other survey can be added
 * - A follow-up survey of year X can be sent at any time during the year X years after the initial survey's year, not before
 * - The end of project survey can't be sent before the previous survey
 * - Only the last survey can be removed, so that the order of the surveys stays consistent
 */
@Component({
  selector: 'app-upsert-satisfaction-survey',
  templateUrl: './upsert-satisfaction-survey.component.html',
  styleUrls: ['./upsert-satisfaction-survey.component.scss']
})
export class UpsertSatisfactionSurveyComponent implements OnInit {
  @Input() satisfactionSurveys: SatisfactionSurveyInterface[];

  SATISFACTION_SURVEY_TYPES = SATISFACTION_SURVEY_TYPES;

  // Stable references: ng-select resets its selection if [items] gets a new array at every change detection
  readonly INITIAL_SURVEY_OPTIONS: string[] = [SATISFACTION_SURVEY_TYPES.INITIAL];
  readonly FOLLOW_UP_SURVEY_OPTIONS: string[] = [SATISFACTION_SURVEY_TYPES.FOLLOW_UP];
  readonly LAST_SURVEY_OPTIONS: string[] = [SATISFACTION_SURVEY_TYPES.FOLLOW_UP, SATISFACTION_SURVEY_TYPES.END_OF_PROJECT];

  // Datepicker inputs cached per row for the same reason (a new object at each change detection resets the datepicker)
  private calendarStartDates: { year: number, month: number }[] = [];
  private markDisabledFns: ((date: NgbDateStruct) => boolean)[] = [];

  // A survey can't be sent in the future
  today: NgbDateStruct = getTodayNgbDate();

  form: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  submitted: boolean = false;

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private satisfactionSurveyService: SatisfactionSurveyService,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      satisfactionSurveys: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get fv() { return this.getSatisfactionSurveysForm()?.value; }

  getSatisfactionSurveysForm(): UntypedFormArray {
    return this.form.get('satisfactionSurveys') as UntypedFormArray;
  }

  newSatisfactionSurvey(surveyType: string): UntypedFormGroup {
    return this.fb.group({
      id: null,
      surveyType: [surveyType, Validators.required],
      numberOfRecipients: [null, Validators.min(1)],
      sentDate: null,
      study: null,
    });
  }

  getFormArray() {
    const formArray = new UntypedFormArray([]);
    this.satisfactionSurveys.forEach((ss) => {
      formArray.push(this.fb.group({
        id: ss.id,
        surveyType: [ss.surveyType, Validators.required],
        numberOfRecipients: [ss.numberOfRecipients, Validators.min(1)],
        sentDate: this.stringToDate(ss.sentDate),
        study: ss?.study,
      }));
    });
    return formArray;
  }

  patchForm() {
    this.form.setControl('satisfactionSurveys', this.getFormArray());
  }

  canAddSurvey(): boolean {
    return !this.fv.some(ss => ss.surveyType === SATISFACTION_SURVEY_TYPES.END_OF_PROJECT);
  }

  addSatisfactionSurvey() {
    const surveyType = this.fv.length === 0 ? SATISFACTION_SURVEY_TYPES.INITIAL : SATISFACTION_SURVEY_TYPES.FOLLOW_UP;
    this.getSatisfactionSurveysForm().push(this.newSatisfactionSurvey(surveyType));
  }

  isLastSurvey(i: number): boolean {
    return i === this.fv.length - 1;
  }

  removeSatisfactionSurvey(i: number) {
    if (this.isLastSurvey(i)) {
      this.getSatisfactionSurveysForm().removeAt(i);
    }
  }

  // The initial survey type is fixed, the end of project survey can only be the last one
  surveyTypeOptions(i: number): string[] {
    if (i === 0) {
      return this.INITIAL_SURVEY_OPTIONS;
    }
    if (this.isLastSurvey(i)) {
      return this.LAST_SURVEY_OPTIONS;
    }
    return this.FOLLOW_UP_SURVEY_OPTIONS;
  }

  // Follow-up surveys are sent every 2 years: the n-th follow-up is the survey of year 2n
  followUpYear(i: number): number {
    if (this.fv[i]?.surveyType !== SATISFACTION_SURVEY_TYPES.FOLLOW_UP) {
      return null;
    }
    const followUpRank = this.fv.slice(0, i + 1).filter(ss => ss.surveyType === SATISFACTION_SURVEY_TYPES.FOLLOW_UP).length;
    return followUpRank * SATISFACTION_SURVEY_INTERVAL_MONTHS / 12;
  }

  surveyLabel(i: number): string {
    const year = this.followUpYear(i);
    return year ? `${this.fv[i].surveyType} – Year ${year}` : this.fv[i]?.surveyType;
  }

  // Earliest date the survey can be sent, null if there is no constraint (yet)
  minSentDate(i: number): NgbDateStruct {
    const surveyType = this.fv[i]?.surveyType;

    if (surveyType === SATISFACTION_SURVEY_TYPES.FOLLOW_UP) {
      const initialSentDate = this.toJsDate(this.fv[0]?.sentDate);
      if (!initialSentDate) {
        return null;
      }
      return { year: initialSentDate.getFullYear() + this.followUpYear(i), month: 1, day: 1 };
    }

    if (surveyType === SATISFACTION_SURVEY_TYPES.END_OF_PROJECT && i > 0) {
      const previousSentDate = this.toJsDate(this.fv[i - 1]?.sentDate);
      if (!previousSentDate) {
        return null;
      }
      return this.toNgbDate(new Date(previousSentDate.getFullYear(), previousSentDate.getMonth(), previousSentDate.getDate() + 1));
    }

    return null;
  }

  // Dates before the earliest allowed date or in the future are greyed out.
  // Not using [minDate]/[maxDate]: ngbDatepicker throws when minDate is after maxDate (survey not due yet),
  // and maxDate would prevent the datepicker from showing the (future) due date
  markDisabled(i: number): (date: NgbDateStruct) => boolean {
    if (!this.markDisabledFns[i]) {
      this.markDisabledFns[i] = (date: NgbDateStruct) => {
        const jsDate = this.toJsDate(date);
        const minDate = this.toJsDate(this.minSentDate(i));
        return jsDate > this.toJsDate(this.today) || (!!minDate && jsDate < minDate);
      };
    }
    return this.markDisabledFns[i];
  }

  // Month the datepicker opens on: the earliest allowed date if any, so that follow-ups open directly on the due year
  calendarStartDate(i: number): { year: number, month: number } {
    const minDate = this.minSentDate(i);
    const cached = this.calendarStartDates[i];
    if (!minDate) {
      return this.calendarStartDates[i] = null;
    }
    if (cached?.year !== minDate.year || cached?.month !== minDate.month) {
      this.calendarStartDates[i] = { year: minDate.year, month: minDate.month };
    }
    return this.calendarStartDates[i];
  }

  // Also checks dates typed manually, which bypass the datepicker min/max dates
  sentDateError(i: number): string {
    const sentDate = this.toJsDate(this.fv[i]?.sentDate);
    if (!sentDate) {
      return null;
    }

    if (sentDate > this.toJsDate(this.today)) {
      return 'The date sent cannot be in the future';
    }

    const minDate = this.toJsDate(this.minSentDate(i));
    if (minDate && sentDate < minDate) {
      if (this.fv[i].surveyType === SATISFACTION_SURVEY_TYPES.FOLLOW_UP) {
        return `A year ${this.followUpYear(i)} follow-up survey cannot be sent before ${this.minSentDate(i).year} (${this.followUpYear(i)} years after the initial survey)`;
      }
      return 'The end of project survey must be sent after the previous survey';
    }

    return null;
  }

  // Next survey is due 24 months after the last date sent, unless the end of project survey has already been sent
  nextSurveyDueDate(): string {
    if (this.isEndOfProjectSurveySent()) {
      return null;
    }

    const sentDates: Date[] = this.fv.map(ss => this.toJsDate(ss.sentDate)).filter(d => d);

    if (sentDates.length === 0) {
      return null;
    }

    const lastSentDate = new Date(Math.max(...sentDates.map(d => d.getTime())));
    const dueDate = new Date(lastSentDate.getFullYear(), lastSentDate.getMonth() + SATISFACTION_SURVEY_INTERVAL_MONTHS, lastSentDate.getDate());
    return this.dateToString(this.toNgbDate(dueDate));
  }

  isEndOfProjectSurveySent(): boolean {
    return this.fv.some(ss => ss.surveyType === SATISFACTION_SURVEY_TYPES.END_OF_PROJECT && ss.sentDate);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.satisfactionSurveys) {
      if (!this.satisfactionSurveys) {
        this.satisfactionSurveys = [];
      }
      this.patchForm();
    }
  }

  isFormValid() {
    this.submitted = true;

    return this.form.valid && !this.fv.some((ss, i) => this.sentDateError(i));
  }

  updatePayload(payload, studyId, i) {
    payload.study = studyId;
    payload.sentDate = this.dateToString(payload.sentDate);
    payload.year = this.followUpYear(i);
    payload.order = i;
  }

  onSave(studyId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));

    // Add/edit satisfaction surveys
    for (const [i, item] of payload.satisfactionSurveys.entries()) {
      this.updatePayload(item, studyId, i);

      let satisfactionSurveyObs$: Observable<Object> = null;
      if (!item.id) { // Add
        satisfactionSurveyObs$ = this.satisfactionSurveyService.addSatisfactionSurveyFromStudy(studyId, item);
      } else {
        satisfactionSurveyObs$ = this.satisfactionSurveyService.editSatisfactionSurvey(item.id, item);
      }

      saveObs$.push(satisfactionSurveyObs$.pipe(
        mergeMap((res: any) => {
          if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
            return of(true);
          }
          this.toastr.error("Failed to save user satisfaction survey");
          return of(false);
        }), catchError(err => {
          this.toastr.error(err.message, "Failed to save user satisfaction survey");
          return of(false);
        })
      ));
    }

    // Deleting items deleted in the UI
    const formItemIds: Set<String> = new Set(payload.satisfactionSurveys.map((item: SatisfactionSurveyInterface) => { return item.id; }));
    const removedItems: Array<SatisfactionSurveyInterface> = this.satisfactionSurveys.filter((initialItem) => !formItemIds.has(initialItem.id));

    removedItems.forEach((item) => {
      saveObs$.push(this.satisfactionSurveyService.deleteSatisfactionSurvey(item.id).pipe(
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

  toJsDate(date: NgbDateStruct): Date {
    return date?.year && date?.month && date?.day ? new Date(date.year, date.month - 1, date.day) : null;
  }

  toNgbDate(date: Date): NgbDateStruct {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }

  stringToDate(date) {
    return stringToDate(date);
  }

  dateToString(date) {
    return dateToString(date);
  }
}
