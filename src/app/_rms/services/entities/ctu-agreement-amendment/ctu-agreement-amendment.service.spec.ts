import { TestBed } from '@angular/core/testing';

import { CtuAgreementAmendmentService } from './ctu-agreement-amendment.service';

describe('CtuAgreementAmendmentService', () => {
  let service: CtuAgreementAmendmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CtuAgreementAmendmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
