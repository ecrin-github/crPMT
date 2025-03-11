import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectTitleComponent } from './object-title.component';

describe('ObjectTitleComponent', () => {
  let component: ObjectTitleComponent;
  let fixture: ComponentFixture<ObjectTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectTitleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
