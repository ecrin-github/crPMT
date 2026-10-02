import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { PersonInterface } from 'src/app/_rms/interfaces/context/person.interface';
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
  countryId: String = null;
  isEuco: boolean = false;
  isAdd = true;
  countries: CountryInterface[] = [];

  showCountry = false;
  showEuCo = false;

  constructor(private contextService: ContextService, private activeModal: NgbActiveModal) {
  }

  ngOnInit(): void {
    this.contextService.countries.subscribe((countries) => {
      this.countries = countries;
    });
  }

  onSave() {
    this.activeModal.close({ 'id': -1, 'fullName': this.fullName, 'email': this.email, 'country': this.countryId, 'isEuco': this.isEuco });
  }

  closeModal() {
    this.activeModal.close(null);
  }

  loadPerson(person: PersonInterface) {
    this.id = person.id;
    this.fullName = person.fullName;
    this.email = person.email;
    this.countryId = person.country?.iso2;
    this.isEuco = person.isEuco;
  }

  searchCountries = (term: string, item: CountryInterface) => {
    return this.contextService.searchCountries(term, item);
  }
}
