import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertReportingPeriodComponent } from './upsert-reporting-period.component';

describe('UpsertReportingPeriodComponent', () => {
  let component: UpsertReportingPeriodComponent;
  let fixture: ComponentFixture<UpsertReportingPeriodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertReportingPeriodComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertReportingPeriodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
