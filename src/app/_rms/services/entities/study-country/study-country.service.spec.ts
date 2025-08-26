import { TestBed } from '@angular/core/testing';

import { StudyCountryService } from './study-country.service';

describe('StudyCountryService', () => {
  let service: StudyCountryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudyCountryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
