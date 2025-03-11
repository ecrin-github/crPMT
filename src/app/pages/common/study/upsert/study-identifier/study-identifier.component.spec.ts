import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyIdentifierComponent } from './study-identifier.component';

describe('StudyIdentifierComponent', () => {
  let component: StudyIdentifierComponent;
  let fixture: ComponentFixture<StudyIdentifierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudyIdentifierComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyIdentifierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
