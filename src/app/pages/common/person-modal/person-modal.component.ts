import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { ContextService } from 'src/app/_rms/services/context/context.service';

@Component({
  selector: 'app-person-modal',
  templateUrl: './person-modal.component.html',
  styleUrls: ['./person-modal.component.scss']
})
export class PersonModalComponent implements OnInit {
  id: String = '-1';
  fullName: String = '';
  email: String = '';
  position: String = '';
  countryId: String = null;
  isEuco: boolean = false;
  isAdd = true;
  countries: CountryInterface[] = [];

  constructor(private contextService: ContextService, private activeModal: NgbActiveModal) {
  }

  ngOnInit(): void {
    this.contextService.countries.subscribe((countries) => {
      this.countries = countries;
    });
  }

  onSave() {
    this.activeModal.close({'id': -1, 'fullName': this.fullName, 'email': this.email, 'position': this.position, 'country': this.countryId, 'isEuco': this.isEuco});
  }

  closeModal() {
    this.activeModal.close(null);
  }

  loadPerson(person) {
    this.id = person.id;
    this.fullName = person.fullName;
    this.email = person.email;
    this.position = person.position;
    this.countryId = person.country?.id;
    this.isEuco = person.isEuco;
  }

  searchCountries = (term: string, item) => {
    return this.contextService.searchCountries(term, item);
  }
}
