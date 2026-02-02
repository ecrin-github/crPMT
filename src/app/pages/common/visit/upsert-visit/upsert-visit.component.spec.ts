import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertVisitComponent } from './upsert-visit.component';

describe('UpsertVisitComponent', () => {
  let component: UpsertVisitComponent;
  let fixture: ComponentFixture<UpsertVisitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertVisitComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertVisitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
