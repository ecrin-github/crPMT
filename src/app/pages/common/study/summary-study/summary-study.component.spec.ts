import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryStudyComponent } from './summary-study.component';

describe('SummaryStudyComponent', () => {
  let component: SummaryStudyComponent;
  let fixture: ComponentFixture<SummaryStudyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SummaryStudyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryStudyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
