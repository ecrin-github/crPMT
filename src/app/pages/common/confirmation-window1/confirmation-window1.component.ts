import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-window1',
  templateUrl: './confirmation-window1.component.html',
  styleUrls: ['./confirmation-window1.component.scss']
})
export class ConfirmationWindow1Component implements OnInit {

  constructor(private activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }
  deleteRecord() {
    this.activeModal.close('data');
  }
  closeModal() {
    this.activeModal.close();
  }
}
