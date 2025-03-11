import { TestBed } from '@angular/core/testing';

import { CommonLookupService } from './common-lookup.service';

describe('CommonLookupService', () => {
  let service: CommonLookupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonLookupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
