import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyTopicComponent } from './study-topic.component';

describe('StudyTopicComponent', () => {
  let component: StudyTopicComponent;
  let fixture: ComponentFixture<StudyTopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudyTopicComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyTopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
