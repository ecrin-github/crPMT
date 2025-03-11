import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectDateComponent } from './object-date.component';

describe('ObjectDateComponent', () => {
  let component: ObjectDateComponent;
  let fixture: ComponentFixture<ObjectDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectDateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
