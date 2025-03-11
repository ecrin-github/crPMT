import { TestBed } from '@angular/core/testing';

import { ReuseService } from './reuse.service';

describe('ReuseService', () => {
  let service: ReuseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReuseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
