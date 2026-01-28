import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-window',
  templateUrl: './confirmation-window.component.html',
  styleUrls: ['./confirmation-window.component.scss']
})
export class ConfirmationWindowComponent implements OnInit {
  buttonMessage: string = "Delete"; // Default
  message: string = "";
  title: string = "Delete record";  // Default
  buttonClass: string = "btn-danger"; // Default

  constructor(private activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  setDefaultDeleteMessage(itemType) {
    this.message = `Are you sure you want to delete this ${itemType}? This action cannot be undone.`;
  }

  closeModal(confirm: boolean) {
    this.activeModal.close(confirm);
  }
}
