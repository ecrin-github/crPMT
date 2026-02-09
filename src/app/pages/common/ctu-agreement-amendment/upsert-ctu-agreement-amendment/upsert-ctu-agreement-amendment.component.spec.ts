import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertCtuAgreementAmendmentComponent } from './upsert-ctu-agreement-amendment.component';

describe('UpsertCtuAgreementAmendmentComponent', () => {
  let component: UpsertCtuAgreementAmendmentComponent;
  let fixture: ComponentFixture<UpsertCtuAgreementAmendmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertCtuAgreementAmendmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertCtuAgreementAmendmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
