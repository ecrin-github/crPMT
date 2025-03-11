import { TestBed } from '@angular/core/testing';

import { ProcessLookupService } from './process-lookup.service';

describe('ProcessLookupService', () => {
  let service: ProcessLookupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcessLookupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
