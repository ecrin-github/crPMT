import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyRelationshipComponent } from './study-relationship.component';

describe('StudyRelationshipComponent', () => {
  let component: StudyRelationshipComponent;
  let fixture: ComponentFixture<StudyRelationshipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudyRelationshipComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyRelationshipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
