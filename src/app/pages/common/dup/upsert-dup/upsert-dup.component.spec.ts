import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertDupComponent } from './upsert-dup.component';

describe('UpsertDupComponent', () => {
  let component: UpsertDupComponent;
  let fixture: ComponentFixture<UpsertDupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertDupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpsertDupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
