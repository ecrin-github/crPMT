import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertProjectComponent } from './upsert-project.component';

describe('UpsertProjectComponent', () => {
  let component: UpsertProjectComponent;
  let fixture: ComponentFixture<UpsertProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpsertProjectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
