import { TestBed } from '@angular/core/testing';

import { StudyCtuService } from './study-ctu.service';

describe('StudyCtuService', () => {
  let service: StudyCtuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudyCtuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
