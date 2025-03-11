import { TestBed } from '@angular/core/testing';

import { DataObjectService } from './data-object.service';

describe('DataObjectService', () => {
  let service: DataObjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataObjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
