import { TestBed } from '@angular/core/testing';

import { DtpService } from './dtp.service';

describe('DtpService', () => {
  let service: DtpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DtpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
