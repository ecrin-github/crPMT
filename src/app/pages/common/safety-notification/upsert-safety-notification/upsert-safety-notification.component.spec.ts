import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertSafetyNotificationComponent } from './upsert-safety-notification.component';

describe('UpsertSafetyNotificationComponent', () => {
  let component: UpsertSafetyNotificationComponent;
  let fixture: ComponentFixture<UpsertSafetyNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertSafetyNotificationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertSafetyNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
