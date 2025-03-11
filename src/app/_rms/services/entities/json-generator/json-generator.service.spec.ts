import { TestBed } from '@angular/core/testing';

import { JsonGeneratorService } from './json-generator.service';

describe('JsonGeneratorService', () => {
  let service: JsonGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
