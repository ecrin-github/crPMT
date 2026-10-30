import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationWindowComponent } from 'src/app/pages/common/confirmation-window/confirmation-window.component';
import { UnsavedChangesService } from '../../services/unsaved-changes/unsaved-changes.service';

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<unknown> {
  /* Use this guard on add/edit pages to ask for confirmation before leaving the page with unsaved changes (#6) */
  constructor(
    private modalService: NgbModal,
    private unsavedChangesService: UnsavedChangesService
  ) {}

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.unsavedChangesService.hasUnsavedChanges()) {
      return true;
    }

    const leaveModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
    leaveModal.componentInstance.title = 'Unsaved changes';
    leaveModal.componentInstance.message = 'You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.';
    leaveModal.componentInstance.buttonMessage = 'Leave page';
    leaveModal.componentInstance.buttonClass = 'btn-warning';

    // Staying on the page if the modal is dismissed
    return leaveModal.result.then((leave: boolean) => leave, () => false);
  }
}
