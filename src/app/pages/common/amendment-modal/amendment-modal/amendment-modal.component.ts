import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-amendment-modal',
  templateUrl: './amendment-modal.component.html',
  styleUrls: ['./amendment-modal.component.scss']
})
export class AmendmentModalComponent implements OnInit {
  constructor(private activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  closeModal() {
    this.activeModal.close();
  }

}
