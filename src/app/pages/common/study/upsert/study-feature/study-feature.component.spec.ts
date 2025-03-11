import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyFeatureComponent } from './study-feature.component';

describe('StudyFeatureComponent', () => {
  let component: StudyFeatureComponent;
  let fixture: ComponentFixture<StudyFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudyFeatureComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
