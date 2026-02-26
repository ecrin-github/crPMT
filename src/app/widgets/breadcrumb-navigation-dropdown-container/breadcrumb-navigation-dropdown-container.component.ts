import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-breadcrumb-navigation-dropdown-container',
  templateUrl: './breadcrumb-navigation-dropdown-container.component.html',
  styleUrls: ['./breadcrumb-navigation-dropdown-container.component.scss']
})
export class BreadcrumbNavigationDropdownContainerComponent implements OnInit {
  @Input() data: any;
  @Input() level: number;
  @Input() displayLowerLevels: boolean = false;

  isEdit: boolean;
  isView: boolean;
  isAdd: boolean;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

}
