import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { ContextService } from 'src/app/_rms/services/context/context.service';

@Component({
  selector: 'app-ctu-modal',
  templateUrl: './ctu-modal.component.html',
  styleUrls: ['./ctu-modal.component.scss']
})
export class CtuModalComponent implements OnInit {
  id: String = '-1';
  shortName: String = '';
  name: String = '';
  countryId: String = '';
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
    this.activeModal.close({'id': -1, 'shortName': this.shortName, 'name': this.name, 'country': this.countryId, 'manualAdd': true});
  }

  closeModal() {
    this.activeModal.close(null);
  }

  loadOrganisation(org) {
    this.id = org.id;
    this.shortName = org.shortName;
    this.name = org.name;
    this.countryId = org.country?.id;
  }

  searchCountries = (term: string, item) => {
    return this.contextService.searchCountries(term, item);
  }

}

