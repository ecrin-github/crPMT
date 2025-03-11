import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { InlineSVGModule } from 'ng-inline-svg';
import {RouterModule} from '@angular/router';
// Advanced Tables
import { AdvanceTablesWidget9Component } from './general/advance-tables/advance-tables-widget9/advance-tables-widget9.component';
// Base Tables
import { BaseTablesWidget2Component } from './general/base-tables/base-tables-widget2/base-tables-widget2.component';
import { BaseTablesWidget6Component } from './general/base-tables/base-tables-widget6/base-tables-widget6.component';
// Lists
import { ListsWidget1Component } from './general/lists/lists-widget1/lists-widget1.component';
import { ListsWidget3Component } from './general/lists/lists-widget3/lists-widget3.component';
import { ListsWidget8Component } from './general/lists/lists-widget8/lists-widget8.component';
import { ListsWidget9Component } from './general/lists/lists-widget9/lists-widget9.component';
import { ListsWidget10Component } from './general/lists/lists-widget10/lists-widget10.component';
// Mixed
import { MixedWidget1Component } from './general/mixed/mixed-widget1/mixed-widget1.component';
import { MixedWidget4Component } from './general/mixed/mixed-widget4/mixed-widget4.component';
import { MixedWidget6Component } from './general/mixed/mixed-widget6/mixed-widget6.component';
import { MixedWidget10Component } from './general/mixed/mixed-widget10/mixed-widget10.component';
import { MixedWidget11Component } from './general/mixed/mixed-widget11/mixed-widget11.component';
import { MixedWidget12Component } from './general/mixed/mixed-widget12/mixed-widget12.component';
import { MixedWidget14Component } from './general/mixed/mixed-widget14/mixed-widget14.component';
// Stats
import { StatsWidget10Component } from './general/stats/stats-widget10/stats-widget10.component';
import { StatsWidget11Component } from './general/stats/stats-widget11/stats-widget11.component';
import { StatsWidget12Component } from './general/stats/stats-widget12/stats-widget12.component';
// Tiles
import { TilesWidget10Component } from './general/tiles/tiles-widget10/tiles-widget10.component';
import { TilesWidget11Component } from './general/tiles/tiles-widget11/tiles-widget11.component';
import { TilesWidget12Component } from './general/tiles/tiles-widget12/tiles-widget12.component';
// Other
import { DropdownMenusModule } from '../dropdown-menus/dropdown-menus.module';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Widget3DropdownComponent } from './general/lists/lists-widget3/widget3-dropdown/widget3-dropdown.component';
// Content
import {CompletedDtuComponent} from './content/internal/completed/completed-dtu/completed-dtu.component';
import {CompletedDupComponent} from './content/internal/completed/completed-dup/completed-dup.component';
import {NewDtuComponent} from './content/internal/new/new-dtu/new-dtu.component';
import {NewDupComponent} from './content/internal/new/new-dup/new-dup.component';
import {NewStudiesComponent} from './content/internal/new/new-studies/new-studies.component';
import {NewObjectsComponent} from './content/internal/new/new-objects/new-objects.component';
import {RecentDtuComponent} from './content/internal/recent/recent-dtu/recent-dtu.component';
import {RecentDupComponent} from './content/internal/recent/recent-dup/recent-dup.component';
import {RecentStudiesComponent} from './content/internal/recent/recent-studies/recent-studies.component';
import {RecentObjectsComponent} from './content/internal/recent/recent-objects/recent-objects.component';
import {RecentUsersComponent} from './content/internal/recent/recent-users/recent-users.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
      // Advanced Tables
      AdvanceTablesWidget9Component,
      // Base Tables
      BaseTablesWidget2Component,
      BaseTablesWidget6Component,
      // Lists
      ListsWidget1Component,
      ListsWidget3Component,
      ListsWidget8Component,
      ListsWidget9Component,
      ListsWidget10Component,
      // Mixed
      MixedWidget1Component,
      MixedWidget4Component,
      MixedWidget6Component,
      MixedWidget10Component,
      MixedWidget11Component,
      MixedWidget12Component,
      MixedWidget14Component,
      // Stats
      StatsWidget10Component,
      StatsWidget11Component,
      StatsWidget12Component,
      // Tiles,
      TilesWidget10Component,
      TilesWidget11Component,
      TilesWidget12Component,
      // Other
      Widget3DropdownComponent,

      // Content
      CompletedDtuComponent,
      CompletedDupComponent,
      NewDtuComponent,
      NewDupComponent,
      NewStudiesComponent,
      NewObjectsComponent,
      RecentDtuComponent,
      RecentDupComponent,
      RecentStudiesComponent,
      RecentObjectsComponent,
      RecentUsersComponent,
  ],
    imports: [
        CommonModule,
        DropdownMenusModule,
        InlineSVGModule,
        NgApexchartsModule,
        NgbDropdownModule,
        RouterModule,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
  
    ],
  exports: [
    // Advanced Tables
    AdvanceTablesWidget9Component,
    // Base Tables
    BaseTablesWidget2Component,
    BaseTablesWidget6Component,
    // Lists
    ListsWidget1Component,
    ListsWidget3Component,
    ListsWidget8Component,
    ListsWidget9Component,
    ListsWidget10Component,
    // Mixed
    MixedWidget1Component,
    MixedWidget4Component,
    MixedWidget6Component,
    MixedWidget10Component,
    MixedWidget11Component,
    MixedWidget12Component,
    MixedWidget14Component,
    // Stats
    StatsWidget10Component,
    StatsWidget11Component,
    StatsWidget12Component,
    // Tiles,
    TilesWidget10Component,
    TilesWidget11Component,
    TilesWidget12Component,
    // Other
    Widget3DropdownComponent,
    // Content
    CompletedDtuComponent,
    CompletedDupComponent,
    NewDtuComponent,
    NewDupComponent,
    NewStudiesComponent,
    NewObjectsComponent,
    RecentDtuComponent,
    RecentDupComponent,
    RecentStudiesComponent,
    RecentObjectsComponent,
    RecentUsersComponent
  ],
})
export class WidgetsModule { }
