import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { NotificationInterface } from 'src/app/_rms/interfaces/core/notification.interface';
import { NotificationService } from 'src/app/_rms/services/entities/notification/notification.service';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';

@Component({
  selector: 'app-upsert-notification',
  templateUrl: './upsert-notification.component.html',
  styleUrls: ['./upsert-notification.component.scss']
})
export class UpsertNotificationComponent implements OnInit {
  @Input() notificationsData: Array<NotificationInterface>;

  form: UntypedFormGroup;
  submitted: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  maxCharsBeforeTruncate: number = 60;

  truncate: boolean[] = [];
  notifications: NotificationInterface[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private notificationService: NotificationService,
    private toastr: ToastrService) {
      this.form = this.fb.group({
        notifications: this.fb.array([])
      });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get g() { return this.form.get('notifications')["controls"]; }

  getControls(i) {
    return this.g[i].controls;
  }

  getNotificationsForm(): UntypedFormArray {
    return this.form.get('notifications') as UntypedFormArray;
  }

  newNotification(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      authority: null,
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
      this.getNotificationsForm().at(0).patchValue({authority: "Ethics Committee"});
      this.getNotificationsForm().at(1).patchValue({authority: "National Competent Authority"});
    }

    for (let i=0; i < this.g.length; i++) {
      this.setInitialTruncate(i);
    }
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.notifications.forEach((notification) => {
      formArray.push(this.fb.group({
        id: notification.id,
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
    if (!nId) { // Notification has been locally added only
      this.getNotificationsForm().removeAt(i);
    } else {  // Existing notification
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.setDefaultDeleteMessage("notification");

      removeModal.result.then((remove) => {
        if (remove) {
          this.notificationService.deleteNotification(nId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getNotificationsForm().removeAt(i);
              this.toastr.success('Notification deleted successfully');
            } else {
              this.toastr.error('Error when deleting notification', res.statusText);
            }
          }, error => {
            this.toastr.error(error);
          });
        }
      }, error => {this.toastr.error(error)});
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

  dateToString(date) {
    return dateToString(date);
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }
}

