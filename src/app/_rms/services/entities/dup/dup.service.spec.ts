import { TestBed } from '@angular/core/testing';

import { DupService } from './dup.service';

describe('DupService', () => {
  let service: DupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
