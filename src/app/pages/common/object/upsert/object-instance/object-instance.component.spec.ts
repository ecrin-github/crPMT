import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectInstanceComponent } from './object-instance.component';

describe('ObjectInstanceComponent', () => {
  let component: ObjectInstanceComponent;
  let fixture: ComponentFixture<ObjectInstanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectInstanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
