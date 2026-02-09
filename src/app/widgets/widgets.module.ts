import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSVGModule } from 'ng-inline-svg';
import {RouterModule} from '@angular/router';
// Advanced Tables
import { TimelineComponent } from './timeline/timeline/timeline.component';
import { NgxEchartsModule } from 'ngx-echarts';
// Base Tables


@NgModule({
  declarations: [
    TimelineComponent,
  ],
    imports: [
        CommonModule,
        InlineSVGModule,
        RouterModule,
        NgxEchartsModule.forChild(),
    ],
  exports: [
    TimelineComponent,
  ],
})
export class WidgetsModule { }
