import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryUserComponent } from './summary-user.component';

describe('SummaryUserComponent', () => {
  let component: SummaryUserComponent;
  let fixture: ComponentFixture<SummaryUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SummaryUserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
