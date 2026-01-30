import { TestBed } from '@angular/core/testing';

import { ReportingPeriodService } from './reporting-period.service';

describe('ReportingPeriodService', () => {
  let service: ReportingPeriodService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportingPeriodService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
