// Angular modules
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatTabsModule} from '@angular/material/tabs';
import {NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';

// Pages
import {InternalMainPageComponent} from './main-page/internal-main-page.component';
import {ReportsPageInternalComponent} from './reports/reports-page-internal.component';

// Additional modules
import {WidgetsModule} from '../../_rms/partials/content/widgets/widgets.module';
import {ReactiveFormsModule} from '@angular/forms';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import { UpsertDtpComponent } from '../common/dtp/upsert-dtp/upsert-dtp.component';
import { SummaryDtpComponent } from '../common/dtp/summary-dtp/summary-dtp.component';
import { UpsertDupComponent } from '../common/dup/upsert-dup/upsert-dup.component';
import { SummaryDupComponent } from '../common/dup/summary-dup/summary-dup.component';
import { StudyListComponent } from '../common/study/study-list/study-list.component';
import { ProjectListComponent } from '../common/project/project-list/project-list.component';
import { UpsertProjectComponent } from '../common/project/upsert-project/upsert-project.component';
import { UpsertStudyComponent } from '../common/study/upsert-study/upsert-study.component';
import { SummaryObjectComponent } from '../common/object/summary-object/summary-object.component';
import { UpsertObjectComponent } from '../common/object/upsert/upsert-object/upsert-object.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgxPermissionsModule } from 'ngx-permissions';
import { CommonPagesModule } from '../common/common-pages.module';
import { SummaryUserComponent } from '../common/user/summary-user/summary-user/summary-user.component';
import { UpsertUserComponent } from '../common/user/upsert/upsert-user/upsert-user.component';
import { ManagerGuard } from 'src/app/_rms/guards/role/manager.guard';
import { RoleGuard } from 'src/app/_rms/guards/role/role.guard';
import { PersonListComponent } from '../common/person/person-list/person-list.component';


@NgModule({
    declarations: [
        InternalMainPageComponent,
        ReportsPageInternalComponent,
    ],
    imports: [
        NgbDatepickerModule,
        MatTableModule,
        MatPaginatorModule,
        MatTabsModule,
        ReactiveFormsModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatButtonModule,
        NgApexchartsModule,
        NgxPermissionsModule.forChild(),
        CommonModule,
        CommonPagesModule,
        WidgetsModule,
        RouterModule.forChild([
            {
                path: '',
                pathMatch: 'full',
                component: InternalMainPageComponent,
                data: { 
                    shouldReuse: true,
                    key: 'internalmainpagecomponent'
                }
            },
            // Studies
            {
                path: 'studies',
                pathMatch: 'full',
                component: StudyListComponent,
                data: { 
                    shouldReuse: true,
                    key: 'summarystudycomponent',
                    reuseRoutesFrom: ['studies/:id/view', 'studies/:id/add', 'studies/:id/edit']
                }
            },
            {
                path: 'studies/add',
                pathMatch: 'full',
                component: UpsertStudyComponent,
                data: { 
                    shouldReuse: false,
                    key: 'upsertstudycomponentadd'
                },
                canActivate: [RoleGuard]
            },
            {
                path: 'projects/add',
                pathMatch: 'full',
                component: UpsertProjectComponent,
                data: { 
                    shouldReuse: false,
                    key: 'upsertprojectcomponentadd'
                },
                canActivate: [RoleGuard]
            },
            {
                path: 'projects',
                pathMatch: 'full',
                component: ProjectListComponent,
                data: { 
                    shouldReuse: true,
                    key: 'ProjectListComponent'
                }
            },
            // People
            {
                path: 'persons',
                pathMatch: 'full',
                component: PersonListComponent,
                data: { 
                    shouldReuse: true,
                    key: 'summaryusercomponent',
                    reuseRoutesFrom: ['persons/:id/view', 'persons/:id/add', 'persons/:id/edit']
                }
            }
        ]),
    ],
})
export class InternalPagesModule {}
