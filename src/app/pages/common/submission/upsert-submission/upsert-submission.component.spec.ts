import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertSubmissionComponent } from './upsert-submission.component';

describe('UpsertSubmissionComponent', () => {
  let component: UpsertSubmissionComponent;
  let fixture: ComponentFixture<UpsertSubmissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertSubmissionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertSubmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
