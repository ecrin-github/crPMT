import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertCentreComponent } from './upsert-centre.component';

describe('UpsertCentreComponent', () => {
  let component: UpsertCentreComponent;
  let fixture: ComponentFixture<UpsertCentreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertCentreComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertCentreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
