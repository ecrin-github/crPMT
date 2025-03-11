import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertDtpComponent } from './upsert-dtp.component';

describe('UpsertDtpComponent', () => {
  let component: UpsertDtpComponent;
  let fixture: ComponentFixture<UpsertDtpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertDtpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpsertDtpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
