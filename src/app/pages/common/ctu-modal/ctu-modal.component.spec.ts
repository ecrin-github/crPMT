import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CtuModalComponent } from './ctu-modal.component';

describe('CtuModalComponent', () => {
  let component: CtuModalComponent;
  let fixture: ComponentFixture<CtuModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CtuModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CtuModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
