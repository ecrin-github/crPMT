import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectIdentifierComponent } from './object-identifier.component';

describe('ObjectIdentifierComponent', () => {
  let component: ObjectIdentifierComponent;
  let fixture: ComponentFixture<ObjectIdentifierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectIdentifierComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectIdentifierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
