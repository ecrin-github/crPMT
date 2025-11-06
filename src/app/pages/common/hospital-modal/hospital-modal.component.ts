import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { ContextService } from 'src/app/_rms/services/context/context.service';

@Component({
  selector: 'app-hospital-modal',
  templateUrl: './hospital-modal.component.html',
  styleUrls: ['./hospital-modal.component.scss']
})
export class HospitalModalComponent implements OnInit {
  id: String = '-1';
  name: String = '';
  city: String = '';
  country: CountryInterface = null;
  isAdd = true;

  constructor(private activeModal: NgbActiveModal) { }

  ngOnInit(): void { }

  onSave() {
    this.activeModal.close({'id': this.id, 'name': this.name, 'city': this.city, 'country': this.country?.id});
  }

  closeModal() {
    this.activeModal.close(null);
  }

  loadHospital(hospital) {
    this.id = hospital.id;
    this.name = hospital.name;
    this.city = hospital.city;
    this.country = hospital.country;
  }
}
