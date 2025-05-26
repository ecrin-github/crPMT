import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertStudyCountryComponent } from './upsert-study-country.component';

describe('UpsertStudyCountryComponent', () => {
  let component: UpsertStudyCountryComponent;
  let fixture: ComponentFixture<UpsertStudyCountryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertStudyCountryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertStudyCountryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
