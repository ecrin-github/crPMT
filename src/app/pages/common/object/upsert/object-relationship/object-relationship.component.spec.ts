import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectRelationshipComponent } from './object-relationship.component';

describe('ObjectRelationshipComponent', () => {
  let component: ObjectRelationshipComponent;
  let fixture: ComponentFixture<ObjectRelationshipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectRelationshipComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectRelationshipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
