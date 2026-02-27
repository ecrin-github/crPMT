import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreadcrumbNavigationDropdownContainerComponent } from './breadcrumb-navigation-dropdown-container.component';

describe('BreadcrumbNavigationDropdownContainerComponent', () => {
  let component: BreadcrumbNavigationDropdownContainerComponent;
  let fixture: ComponentFixture<BreadcrumbNavigationDropdownContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BreadcrumbNavigationDropdownContainerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreadcrumbNavigationDropdownContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
