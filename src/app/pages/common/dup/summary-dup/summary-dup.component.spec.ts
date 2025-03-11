import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryDupComponent } from './summary-dup.component';

describe('SummaryDupComponent', () => {
  let component: SummaryDupComponent;
  let fixture: ComponentFixture<SummaryDupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SummaryDupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryDupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
