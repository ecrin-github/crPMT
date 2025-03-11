import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectContributorComponent } from './object-contributor.component';

describe('ObjectContributorComponent', () => {
  let component: ObjectContributorComponent;
  let fixture: ComponentFixture<ObjectContributorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjectContributorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectContributorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
