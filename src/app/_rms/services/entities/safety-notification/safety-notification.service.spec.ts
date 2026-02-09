import { TestBed } from '@angular/core/testing';

import { SafetyNotificationService } from './safety-notification.service';

describe('SafetyNotificationService', () => {
  let service: SafetyNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SafetyNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
