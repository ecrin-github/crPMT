import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { SubmissionInterface } from 'src/app/_rms/interfaces/core/submission.interface';
import { SubmissionService } from 'src/app/_rms/services/entities/submission/submission.service';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';

@Component({
  selector: 'app-upsert-submission',
  templateUrl: './upsert-submission.component.html',
  styleUrls: ['./upsert-submission.component.scss']
})
export class UpsertSubmissionComponent implements OnInit {
  @Input() submissionsData: Array<SubmissionInterface>;
  @Input() isAmendments: boolean = false;
  @Input() isOthers: boolean = false;

  form: UntypedFormGroup;
  submitted: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  maxCharsBeforeTruncate: number = 100;

  truncate: boolean[] = [];
  submissions: SubmissionInterface[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private submissionService: SubmissionService,
    private toastr: ToastrService) {
      this.form = this.fb.group({
        submissions: this.fb.array([])
      });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  get g() { return this.form.get('submissions')["controls"]; }

  getControls(i) {
    return this.g[i].controls;
  }

  getSubmissionsForm(): UntypedFormArray {
    return this.form.get('submissions') as UntypedFormArray;
  }

  newSubmission(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      authority: null,
      submissionDate: null,
      approvalDate: null,
      protocolApprovalDate: null,
      protocolApprovedVersion: null,
      comment: null,
      isAmendment: this.isAmendments,
      amendmentReason: null,
      isOtherNotification: this.isOthers,
      studyCountry: null,
    });
  }

  patchForm() {
    this.form.setControl('submissions', this.patchArray());
    if (!this.isAmendments && !this.isOthers && this.getSubmissionsForm().length == 0) { // Adding EC and NCA if None have been found in study country (if isAdd for example)
      this.addSubmission();
      this.addSubmission();
      this.getSubmissionsForm().at(0).patchValue({authority: "Ethics Committee"});
      this.getSubmissionsForm().at(1).patchValue({authority: "National Competent Authority"});
    }

    for (let i=0; i < this.g.length; i++) {
      this.setInitialTruncate(i);
    }
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.submissions.forEach((submission) => {
      formArray.push(this.fb.group({
        id: submission.id,
        authority: submission.authority,
        submissionDate: submission.submissionDate ? stringToDate(submission.submissionDate) : null,
        approvalDate: submission.approvalDate ? stringToDate(submission.approvalDate) : null,
        protocolApprovalDate: submission.protocolApprovalDate ? stringToDate(submission.protocolApprovalDate) : null,
        protocolApprovedVersion: submission.protocolApprovedVersion,
        comment: submission.comment,
        isAmendment: submission.isAmendment,
        amendmentReason: submission.amendmentReason,
        isOtherNotification: submission.isOtherNotification,
        studyCountry: submission.studyCountry?.id,
      }))
    });
    return formArray;
  }

  // TODO?
  ngOnChanges(changes: SimpleChanges) {
    if (changes.submissionsData) {
      if (!this.submissionsData) {
        this.submissions = [];
      } else {
        this.submissions = this.submissionsData;
      }
      this.patchForm();
    }
  }

  addSubmission() {
    this.getSubmissionsForm().push(this.newSubmission());
  }

  deleteSubmission(i: number) {
    const sId = this.getSubmissionsForm().value[i].id;
    if (!sId) { // Submission has been locally added only
      this.getSubmissionsForm().removeAt(i);
    } else {  // Existing submission
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.itemType = "study CTU";

      removeModal.result.then((remove) => {
        if (remove) {
          this.submissionService.deleteSubmission(sId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getSubmissionsForm().removeAt(i);
              this.toastr.success('Submission deleted successfully');
            } else {
              this.toastr.error('Error when deleting submission', res.statusText);
            }
          }, error => {
            this.toastr.error(error);
          });
        }
      }, error => {this.toastr.error(error)});
    }
  }

  setInitialTruncate(i) {
    if (this.form.value?.submissions[i]?.comment?.length > this.maxCharsBeforeTruncate) {
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

  displayText(i, text) {
    if (this.truncate[i]) {
      return text.slice(0, this.maxCharsBeforeTruncate) + "...";
    }
    return text;
  }

  // TODO?
  formValid() {
    // this.submitted = true;
    
    // // Manually checking CTU field (shouldn't be empty)
    // for (const i in this.form.get("submissions")['controls']) {
    //   if (this.form.get("submissions")['controls'][i].value.ctu == null) {
    //     this.form.get("submissions")['controls'][i].controls.ctu.setErrors({'required': true});
    //   }
    // }

    return this.form.valid;
  }

  updatePayload(payload, scId, i) {
    payload.studyCountry = scId;

    if (payload.submissionDate) {
      payload.submissionDate = dateToString(payload.submissionDate);
    }
    if (payload.approvalDate) {
      payload.approvalDate = dateToString(payload.approvalDate);
    }
    if (payload.protocolApprovalDate) {
      payload.protocolApprovalDate = dateToString(payload.protocolApprovalDate);
    }

    payload.order = i;
  }

  onSave(scId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));
  
    for (const [i, item] of payload.submissions.entries()) {
      this.updatePayload(item, scId, i);
      if (!item.id) { // Add
        saveObs$.push(this.submissionService.addSubmissionFromStudyCountry(scId, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 201) {
              return of(true);
            }
            return of(false);
          })
        ));
      } else {  // Edit
        saveObs$.push(this.submissionService.editSubmission(item.id, item).pipe(
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
