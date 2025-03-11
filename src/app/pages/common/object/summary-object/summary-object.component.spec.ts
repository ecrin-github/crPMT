import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryObjectComponent } from './summary-object.component';

describe('SummaryObjectComponent', () => {
  let component: SummaryObjectComponent;
  let fixture: ComponentFixture<SummaryObjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SummaryObjectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryObjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
