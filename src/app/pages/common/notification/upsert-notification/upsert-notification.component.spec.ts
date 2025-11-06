import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertNotificationComponent } from './upsert-notification.component';

describe('UpsertNotificationComponent', () => {
  let component: UpsertNotificationComponent;
  let fixture: ComponentFixture<UpsertNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertNotificationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
