import { TestBed } from '@angular/core/testing';

import { ObjectLookupService } from './object-lookup.service';

describe('ObjectLookupService', () => {
  let service: ObjectLookupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjectLookupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
