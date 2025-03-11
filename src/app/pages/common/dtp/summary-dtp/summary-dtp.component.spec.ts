import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryDtpComponent } from './summary-dtp.component';

describe('SummaryDtpComponent', () => {
  let component: SummaryDtpComponent;
  let fixture: ComponentFixture<SummaryDtpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SummaryDtpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryDtpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
