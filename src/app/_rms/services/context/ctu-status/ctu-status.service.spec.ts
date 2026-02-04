import { TestBed } from '@angular/core/testing';

import { CtuStatusService } from './ctu-status.service';

describe('CtuStatusService', () => {
  let service: CtuStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CtuStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
