import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSVGModule } from 'ng-inline-svg';
import { RouterModule } from '@angular/router';
import { TimelineComponent } from './timeline/timeline/timeline.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { BreadcrumbNavigationDropdownComponent } from './breadcrumb-navigation-dropdown/breadcrumb-navigation-dropdown.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { BreadcrumbNavigationDropdownContainerComponent } from './breadcrumb-navigation-dropdown-container/breadcrumb-navigation-dropdown-container.component';


@NgModule({
  declarations: [
    TimelineComponent,
    BreadcrumbNavigationDropdownComponent,
    BreadcrumbNavigationDropdownContainerComponent,
  ],
  imports: [
    CommonModule,
    InlineSVGModule,
    RouterModule,
    NgbDropdownModule,
    NgxEchartsModule.forChild(),
  ],
  exports: [
    TimelineComponent,
    BreadcrumbNavigationDropdownComponent,
    BreadcrumbNavigationDropdownContainerComponent,
  ],
})
export class WidgetsModule { }
