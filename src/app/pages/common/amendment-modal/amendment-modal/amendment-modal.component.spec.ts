import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmendmentModalComponent } from './amendment-modal.component';

describe('AmendmentModalComponent', () => {
  let component: AmendmentModalComponent;
  let fixture: ComponentFixture<AmendmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmendmentModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmendmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
