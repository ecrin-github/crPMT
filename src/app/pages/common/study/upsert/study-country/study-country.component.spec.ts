import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudyCountryComponent } from './study-country.component';

describe('StudyCountryComponent', () => {
  let component: StudyCountryComponent;
  let fixture: ComponentFixture<StudyCountryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StudyCountryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudyCountryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
