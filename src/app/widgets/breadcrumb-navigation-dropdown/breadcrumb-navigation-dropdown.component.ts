import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Levels } from 'src/assets/js/constants';
import { getCountryFlagFromIso2 } from 'src/assets/js/util';

@Component({
  selector: 'app-breadcrumb-navigation-dropdown',
  templateUrl: './breadcrumb-navigation-dropdown.component.html',
  styleUrls: ['./breadcrumb-navigation-dropdown.component.scss']
})
export class BreadcrumbNavigationDropdownComponent implements OnInit {
  @Input() item: any;
  @Input() level: number;
  @Input() displayLowerLevels: boolean = false;

  Levels = Levels;

  isEdit: boolean;
  isView: boolean;
  isAdd: boolean;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');
  }

  getItemDisplayText(item, level: number): string {
    let displayName = "";
    switch (level) {
      case Levels.PROJECT:
        displayName = item.shortName;
        break;
      case Levels.STUDY:
        displayName = item.shortTitle;
        break;
      case Levels.STUDY_COUNTRY:
        displayName = getCountryFlagFromIso2(item.country?.iso2) + " " + item.country?.name;
        break;
      case Levels.STUDY_CTU:
        displayName = item.ctu?.shortName ? item.ctu.shortName : item.ctu.name;
        break;
    }
    return displayName;
  }

  getRouteRoot(level: number): string {
    let routeRoot = "#"; // TODO?
    switch (level) {
      case Levels.PROJECT:
        routeRoot = '/projects';
        break;
      case Levels.STUDY:
        routeRoot = '/studies';
        break;
      case Levels.STUDY_COUNTRY:
        routeRoot = '/study-countries';
        break;
      case Levels.STUDY_CTU:
        routeRoot = '/study-ctus';
        break;
    }
    return routeRoot;
  }

  getNextItems(item, nextLevel: number) {
    let nextItems = null;
    switch (nextLevel) {
      // Note: no projects because it's the "root" level
      case Levels.STUDY:
        nextItems = item.studies;
        break;
      case Levels.STUDY_COUNTRY:
        nextItems = item.studyCountries;
        break;
      case Levels.STUDY_CTU:
        nextItems = item.studyCtus;
        break;
    }

    if (!nextItems) {
      nextItems = [];
    }

    return nextItems;
  }

  hasNextItems(items, nextLevel) {
    return this.getNextItems(items, nextLevel)?.length > 0;
  }
}
