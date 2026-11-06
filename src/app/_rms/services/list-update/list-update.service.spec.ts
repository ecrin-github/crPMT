import { TestBed } from '@angular/core/testing';

import { ListUpdateService } from './list-update.service';

describe('ListUpdateService', () => {
  let service: ListUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
