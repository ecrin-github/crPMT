import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertObjectComponent } from './upsert-object.component';

describe('UpsertObjectComponent', () => {
  let component: UpsertObjectComponent;
  let fixture: ComponentFixture<UpsertObjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertObjectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpsertObjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
