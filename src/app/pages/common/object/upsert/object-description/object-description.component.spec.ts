import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectDescriptionComponent } from './object-description.component';

describe('ObjectDescriptionComponent', () => {
  let component: ObjectDescriptionComponent;
  let fixture: ComponentFixture<ObjectDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectDescriptionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
