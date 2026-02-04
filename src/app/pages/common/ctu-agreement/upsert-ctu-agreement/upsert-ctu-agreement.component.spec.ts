import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertCtuAgreementComponent } from './upsert-ctu-agreement.component';

describe('UpsertCtuAgreementComponent', () => {
  let component: UpsertCtuAgreementComponent;
  let fixture: ComponentFixture<UpsertCtuAgreementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertCtuAgreementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertCtuAgreementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
