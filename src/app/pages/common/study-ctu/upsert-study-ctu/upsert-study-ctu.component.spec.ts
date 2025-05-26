import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertStudyCtuComponent } from './upsert-study-ctu.component';

describe('UpsertStudyCtuComponent', () => {
  let component: UpsertStudyCtuComponent;
  let fixture: ComponentFixture<UpsertStudyCtuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertStudyCtuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertStudyCtuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
