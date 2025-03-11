import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectRightComponent } from './object-right.component';

describe('ObjectRightComponent', () => {
  let component: ObjectRightComponent;
  let fixture: ComponentFixture<ObjectRightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectRightComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
