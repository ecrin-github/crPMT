import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertStudyComponent } from './upsert-study.component';

describe('UpsertStudyComponent', () => {
  let component: UpsertStudyComponent;
  let fixture: ComponentFixture<UpsertStudyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertStudyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpsertStudyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
