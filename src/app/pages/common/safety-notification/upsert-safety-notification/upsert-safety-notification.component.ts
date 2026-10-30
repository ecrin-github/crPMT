import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { SafetyNotificationService } from 'src/app/_rms/services/entities/safety-notification/safety-notification.service';
import { dateToString } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { AuthorityCodes, CA_TEXT, EC_TEXT } from 'src/assets/js/constants';

@Component({
    selector: 'app-upsert-safety-notification',
    templateUrl: './upsert-safety-notification.component.html',
    styleUrls: ['./upsert-safety-notification.component.scss']
})
export class UpsertSafetyNotificationComponent implements OnInit {
    AuthorityCodes = AuthorityCodes;

    @ViewChildren('submissionDate', { read: ElementRef }) submissionDateInputs: QueryList<ElementRef>;

    @Input() authorityCode: String;
    @Input() display: boolean;
    @Input() typeCode: String;
    @Input() form: UntypedFormGroup;

    formValueChangesSub: Subscription = null;
    submitted: boolean = false;
    isEdit: boolean = false;
    isView: boolean = false;
    isAdd: boolean = false;

    constructor(
        private cdr: ChangeDetectorRef,
        private fb: UntypedFormBuilder,
        private contextService: ContextService,
        private modalService: NgbModal,
        private router: Router,
        private safetyNotificationService: SafetyNotificationService,
        private toastr: ToastrService) {
    }

    ngOnInit(): void {
        this.isEdit = this.router.url.includes('edit');
        this.isView = this.router.url.includes('view');
        this.isAdd = this.router.url.includes('add');
    }

    get g() { return this.form.get('safetyNotifications')["controls"]; }

    getControls(i) {
        return this.g[i].controls;
    }

    getSafetyNotificationsForm(): UntypedFormArray {
        return this.form.get('safetyNotifications') as UntypedFormArray;
    }

    newSafetyNotification(): UntypedFormGroup {
        return this.fb.group({
            id: null,
            authority: this.authorityCode,
            submissionDate: null,
            year: null,
            notificationType: this.typeCode,
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        // Note: have to do this because shared forms values don't update in the UI (thanks Angular!)
        // See: https://stackoverflow.com/questions/77694477/update-the-view-of-two-forms-sharing-a-formgroup
        if (changes.form && this.form) {
            this.formValueChangesSub?.unsubscribe();

            this.formValueChangesSub = this.form.valueChanges.subscribe((change) => {
                if (change.safetyNotifications) {
                    this.form.patchValue({ "safetyNotifications": change.safetyNotifications }, { emitEvent: false });

                    // Further hack to update ngbdate fields (submission date) because patchValue expects a ngbdate, otherwise you cannot type in the field
                    Promise.resolve().then(() => {
                        for (const [index, c] of change.safetyNotifications?.entries()) {
                            if (typeof c?.submissionDate === 'string' && this.submissionDateInputs.get(index)) {
                                this.submissionDateInputs.get(index).nativeElement.value = c.submissionDate;
                            }
                        }
                        this.cdr.detectChanges();
                    });
                }
            });
        }
    }

    addSafetyNotification() {
        this.getSafetyNotificationsForm().push(this.newSafetyNotification());
    }

    deleteSafetyNotification(i: number) {
        const nId = this.getSafetyNotificationsForm().value[i].id;
        this.getSafetyNotificationsForm().removeAt(i);
        // Removing a row doesn't make the form dirty, needed for the unsaved changes popup (#6)
        this.getSafetyNotificationsForm().markAsDirty();
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

    updatePayload(payload, i) {
        if (payload.submissionDate) {
            payload.submissionDate = dateToString(payload.submissionDate);
        }

        payload.authority = this.authorityCode;

        payload.order = i;
    }

    onSave(): Observable<string[]> {
        this.submitted = true;
        let saveObs$: Array<Observable<string[]>> = [];

        const payload = JSON.parse(JSON.stringify(this.form.value));

        // One bulk query for the added items and one for the edited items, instead of one query per item (#18)
        const addPayload = [];
        const editPayload = [];

        for (const [i, item] of payload.safetyNotifications.entries()) {
            this.updatePayload(item, i);

            if (!item.id) { // Add
                addPayload.push(item);
            } else {  // Edit
                editPayload.push(item);
            }
        }

        if (addPayload.length > 0) {
            saveObs$.push(this.savedIds$(this.safetyNotificationService.addSafetyNotifications(addPayload), addPayload, 201));
        }

        if (editPayload.length > 0) {
            saveObs$.push(this.savedIds$(this.safetyNotificationService.editSafetyNotifications(editPayload), editPayload, 200));
        }

        if (saveObs$.length == 0) {
            saveObs$.push(of([null]));
        }

        return combineLatest(saveObs$).pipe(map((idsArr: string[][]) => [].concat(...idsArr)));
    }

    // Ids of the safety notifications saved by a bulk query, null for each item if the query failed
    savedIds$(query$: Observable<any>, items: any[], expectedStatus: number): Observable<string[]> {
        return query$.pipe(
            map((res: any) => {
                if (res.status === expectedStatus) {
                    return res.body.map((sn) => sn.id);
                }
                return items.map(() => null);
            }), catchError(err => {
                this.toastr.error(err?.message, "Failed to save safety notifications");
                return of(items.map(() => null));
            })
        );
    }

    dateToString(date) {
        return dateToString(date);
    }

    compareIds(fv1, fv2): boolean {
        return fv1?.id == fv2?.id;
    }

    ngOnDestroy(): void {
        this.formValueChangesSub?.unsubscribe();
    }
}

