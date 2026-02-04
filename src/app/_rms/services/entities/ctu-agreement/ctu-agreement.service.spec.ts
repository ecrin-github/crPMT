import { TestBed } from '@angular/core/testing';

import { CtuAgreementService } from './ctu-agreement.service';

describe('CtuAgreementService', () => {
  let service: CtuAgreementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CtuAgreementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
