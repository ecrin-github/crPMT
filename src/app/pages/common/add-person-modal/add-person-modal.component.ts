import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-person-modal',
  templateUrl: './add-person-modal.component.html',
  styleUrls: ['./add-person-modal.component.scss']
})
export class AddPersonModalComponent implements OnInit {
  fullName: String = '';
  email: String = '';
  position: String = '';

  constructor(private fb: UntypedFormBuilder, private activeModal: NgbActiveModal) {
  }

  ngOnInit(): void {
  }

  onSave() {
    this.activeModal.close({'id': -1, 'fullName': this.fullName, 'email': this.email, 'position': this.position});
  }

  closeModal() {
    this.activeModal.close(null);
  }

}
