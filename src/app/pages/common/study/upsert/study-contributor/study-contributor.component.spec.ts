import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyContributorComponent } from './study-contributor.component';

describe('StudyContributorComponent', () => {
  let component: StudyContributorComponent;
  let fixture: ComponentFixture<StudyContributorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudyContributorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyContributorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
