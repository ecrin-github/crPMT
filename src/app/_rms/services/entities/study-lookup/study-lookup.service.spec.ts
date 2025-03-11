import { TestBed } from '@angular/core/testing';

import { StudyLookupService } from './study-lookup.service';

describe('StudyLookupService', () => {
  let service: StudyLookupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudyLookupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
