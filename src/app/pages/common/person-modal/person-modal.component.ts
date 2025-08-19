import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
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
  country: String = '';
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
    this.activeModal.close({'id': -1, 'fullName': this.fullName, 'email': this.email, 'position': this.position, 'country': this.country, 'isEuco': this.isEuco});
  }

  closeModal() {
    this.activeModal.close(null);
  }

  loadPerson(person) {
    this.id = person.id;
    this.fullName = person.fullName;
    this.email = person.email;
    this.position = person.position;
    this.country = person.country?.id;
    this.isEuco = person.isEuco;
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }

  searchCountries(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1;
  }
}
