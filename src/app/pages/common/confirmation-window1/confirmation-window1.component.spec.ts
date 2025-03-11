import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationWindow1Component } from './confirmation-window1.component';

describe('ConfirmationWindow1Component', () => {
  let component: ConfirmationWindow1Component;
  let fixture: ComponentFixture<ConfirmationWindow1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmationWindow1Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationWindow1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
