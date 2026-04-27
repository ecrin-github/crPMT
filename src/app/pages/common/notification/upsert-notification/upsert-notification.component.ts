import { Component, Input, OnInit, OnDestroy, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of, Subject } from 'rxjs';
import { mergeMap, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NotificationInterface } from 'src/app/_rms/interfaces/core/notification.interface';
import { NotificationService } from 'src/app/_rms/services/entities/notification/notification.service';
import { RegulatoryLinkService } from 'src/app/_rms/services/common/regulatory-link/regulatory-link.service';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { AuthorityCodes, EC_TEXT, NCA_TEXT } from 'src/assets/js/constants';

@Component({
  selector: 'app-upsert-notification',
  templateUrl: './upsert-notification.component.html',
  styleUrls: ['./upsert-notification.component.scss']
})
export class UpsertNotificationComponent implements OnInit, OnDestroy {
  @Input() notificationsData: Array<NotificationInterface>;
  @Input() studyCountry: any;

  form: UntypedFormGroup;
  submitted: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  maxCharsBeforeTruncate: number = 60;

  AuthorityCodes = AuthorityCodes;
  EC_TEXT = EC_TEXT;
  NCA_TEXT = NCA_TEXT;

  truncate: boolean[] = [];
  notifications: NotificationInterface[] = [];

  // Subjects for authority field debounce
  private authorityChanges$ = new Subject<{ index: number; authority: string }>();
  private destroy$ = new Subject<void>();
  private previousAuthorities: Map<number, string> = new Map(); // Track previous authorities to clean up links

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private notificationService: NotificationService,
    private regulatoryLinkService: RegulatoryLinkService,
    private toastr: ToastrService) {
    this.form = this.fb.group({
      notifications: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');

    // Subscribe to regulatory link changes
    this.regulatoryLinkService.links$.subscribe(() => {
      this.syncNotApplicableFromService();
    });

    // Setup authority field changes with debounce for N/A sync
    this.authorityChanges$
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged((prev, curr) => prev.index === curr.index && prev.authority === curr.authority),
        takeUntil(this.destroy$)
      )
      .subscribe(({ index, authority }) => {
        this.syncNotApplicableOnAuthorityChange(index, authority);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fc() { return this.form.get('notifications')["controls"]; }
  get fv() { return this.form.get('notifications')?.value; }

  getControls(i) {
    return this.fc[i].controls;
  }

  getNotificationsForm(): UntypedFormArray {
    return this.form.get('notifications') as UntypedFormArray;
  }

  newNotification(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      authority: null,
      notApplicable: false,
      notificationDate: null,
      comment: null,
      studyCountry: null,
    });
  }

  patchForm() {
    this.form.setControl('notifications', this.patchArray());
    if (this.getNotificationsForm().length == 0) { // Adding EC and NCA if None have been found in study country (if isAdd for example)
      this.addNotification();
      this.addNotification();
      this.getNotificationsForm().at(0).patchValue({ authority: AuthorityCodes.EC });
      this.getNotificationsForm().at(1).patchValue({ authority: AuthorityCodes.NCA });
    }

    for (let i = 0; i < this.fc.length; i++) {
      this.setInitialTruncate(i);
      this.onChangeNotApplicable(i);
    }
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.notifications.forEach((notification: NotificationInterface) => {
      formArray.push(this.fb.group({
        id: notification.id,
        notApplicable: notification.notApplicable,
        authority: notification.authority,
        notificationDate: notification.notificationDate ? stringToDate(notification.notificationDate) : null,
        comment: notification.comment,
        studyCountry: notification.studyCountry?.id,
      }))
    });
    return formArray;
  }

  // TODO?
  ngOnChanges(changes: SimpleChanges) {
    if (changes.notificationsData) {
      if (!this.notificationsData) {
        this.notifications = [];
      } else {
        this.notifications = this.notificationsData;
      }
      this.patchForm();
    }
  }

  addNotification() {
    this.getNotificationsForm().push(this.newNotification());
  }

  deleteNotification(i: number) {
    const nId = this.getNotificationsForm().value[i].id;
    const authority = this.fv[i]?.authority;
    
    if (!nId) { // Notification has been locally added only
      // Clean up link for this authority
      if (this.studyCountry?.id && authority) {
        this.regulatoryLinkService.removeLink(this.studyCountry.id, authority);
      }
      this.previousAuthorities.delete(i);
      this.getNotificationsForm().removeAt(i);
    } else {  // Existing notification
      const removeModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
      removeModal.componentInstance.setDefaultDeleteMessage("notification");

      removeModal.result.then((remove) => {
        if (remove) {
          this.notificationService.deleteNotification(nId).subscribe((res: any) => {
            if (res.status === 204) {
              // Clean up link for this authority
              if (this.studyCountry?.id && authority) {
                this.regulatoryLinkService.removeLink(this.studyCountry.id, authority);
              }
              this.previousAuthorities.delete(i);
              this.getNotificationsForm().removeAt(i);
              this.toastr.success('Notification deleted successfully');
            } else {
              this.toastr.error('Error when deleting notification', res.statusText);
            }
          }, error => {
            this.toastr.error(error);
          });
        }
      }, error => { this.toastr.error(error) });

    }
  }

  setInitialTruncate(i) {
    if (this.form.value?.notifications[i]?.comment?.length > this.maxCharsBeforeTruncate) {
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

  updatePayload(payload, scId, i) {
    payload.studyCountry = scId;

    if (payload.notificationDate) {
      payload.notificationDate = dateToString(payload.notificationDate);
    }

    payload.order = i;
  }

  onSave(scId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));

    for (const [i, item] of payload.notifications.entries()) {
      this.updatePayload(item, scId, i);
      if (!item.id) { // Add
        saveObs$.push(this.notificationService.addNotificationFromStudyCountry(scId, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 201) {
              return of(true);
            }
            return of(false);
          })
        ));
      } else {  // Edit
        saveObs$.push(this.notificationService.editNotification(item.id, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              return of(true);
            }
            return of(false);
          })
        ));
      }
    }

    if (saveObs$.length == 0) {
      saveObs$.push(of(true));
    }

    return combineLatest(saveObs$);
  }

  onChangeNotApplicable(i) {
    // Clear related fields when N/A is checked
    if (this.fv[i]?.notApplicable) {
      this.clearFieldsOnNotApplicable(i);
    }

    // Update regulatory link service
    if (this.studyCountry?.id && this.fv[i]?.authority) {
      this.regulatoryLinkService.setNotApplicable(
        this.studyCountry.id,
        this.fv[i].authority,
        this.fv[i].notApplicable || false,
        'notification'
      );
    }
  }

  /**
   * Handle authority field changes with debounce
   */
  onAuthorityChange(index: number, authority: string): void {
    this.authorityChanges$.next({ index, authority });
  }

  private syncNotApplicableFromService() {
    if (!this.studyCountry?.id) return;

    for (let i = 0; i < this.fc.length; i++) {
      const authority = this.fv[i]?.authority;
      if (authority) {
        const linkedNotApplicable = this.regulatoryLinkService.getNotificationNotApplicable(
          this.studyCountry.id,
          authority
        );
        if (this.fv[i].notApplicable !== linkedNotApplicable) {
          this.getControls(i)?.notApplicable?.setValue(linkedNotApplicable);
          // Don't call onChangeNotApplicable here to avoid recursion
          if (linkedNotApplicable) {
            this.clearFieldsOnNotApplicable(i);
          }
        }
      }
    }
  }

  /**
   * Sync N/A state when authority field changes (with debounce)
   */
  private syncNotApplicableOnAuthorityChange(index: number, authority: string): void {
    if (!this.studyCountry?.id || !authority) return;

    // Remove old authority link if it changed
    const previousAuthority = this.previousAuthorities.get(index);
    if (previousAuthority && previousAuthority !== authority) {
      this.regulatoryLinkService.removeLink(this.studyCountry.id, previousAuthority);
    }
    // Track the new authority
    this.previousAuthorities.set(index, authority);

    const linkedNotApplicable = this.regulatoryLinkService.getNotificationNotApplicable(
      this.studyCountry.id,
      authority
    );

    if (this.fv[index].notApplicable !== linkedNotApplicable) {
      this.getControls(index)?.notApplicable?.setValue(linkedNotApplicable);
      if (linkedNotApplicable) {
        this.clearFieldsOnNotApplicable(index);
      }
    }
  }

  /**
   * Clear all related fields when N/A checkbox is checked
   */
  private clearFieldsOnNotApplicable(i: number): void {
    const controls = this.getControls(i);
    if (controls) {
      controls.notificationDate?.setValue(null);
      controls.comment?.setValue(null);
    }
  }

  displayAuthority(authCode) {
    if (authCode === AuthorityCodes.EC) return EC_TEXT;
    if (authCode === AuthorityCodes.NCA) return NCA_TEXT;
    return authCode;
  }

  isFixedAuthorityCode(authCode) {
    return authCode === AuthorityCodes.EC || authCode === AuthorityCodes.NCA;
  }

  dateToString(date) {
    return dateToString(date);
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }
}

