import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreadcrumbNavigationDropdownComponent } from './breadcrumb-navigation-dropdown.component';

describe('BreadcrumbNavigationDropdownComponent', () => {
  let component: BreadcrumbNavigationDropdownComponent;
  let fixture: ComponentFixture<BreadcrumbNavigationDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BreadcrumbNavigationDropdownComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreadcrumbNavigationDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
