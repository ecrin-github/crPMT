// Angular modules
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatTabsModule} from '@angular/material/tabs';

// Pages
import {ExternalMainPageComponent} from './main-page/external-main-page.component';
import { CommonPagesModule } from '../common/common-pages.module';
// import {DtpSummaryExternalComponent} from './main-page/dtp/dtp-summary-external.component';
// import {DupSummaryExternalComponent} from './main-page/dup/dup-summary-external.component';
// import {StudiesSummaryExternalComponent} from './main-page/studies/studies-summary-external.component';
// import {ObjectsSummaryExternalComponent} from './main-page/objects/objects-summary-external.component';




@NgModule({
    declarations: [
        ExternalMainPageComponent,
        // DtpSummaryExternalComponent,
        // DupSummaryExternalComponent,
        // StudiesSummaryExternalComponent,
        // ObjectsSummaryExternalComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild([
            // Main page
            {
                path: '',
                pathMatch: 'full',
                component: ExternalMainPageComponent,
                data: { 
                    shouldReuse: false,
                    key: 'externalmainpagecomponent'
                }
            }
        ]),
        MatTableModule,
        MatPaginatorModule,
        MatTabsModule,
        CommonPagesModule
    ]
})
export class ExternalPagesModule {}
