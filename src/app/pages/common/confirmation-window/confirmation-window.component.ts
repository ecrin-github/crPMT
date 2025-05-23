import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-window',
  templateUrl: './confirmation-window.component.html',
  styleUrls: ['./confirmation-window.component.scss']
})
export class ConfirmationWindowComponent implements OnInit {
  itemType: any;

  constructor(
    private activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  closeModal(confirm: boolean) {
    this.activeModal.close(confirm);
  }
}
