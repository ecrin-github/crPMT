// Angular modules
import { CommonModule } from '@angular/common';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { NgbActiveModal, NgbDatepickerModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule } from 'primeng/calendar';

// Pages
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPermissionsModule } from 'ngx-permissions';
import { RoleGuard } from 'src/app/_rms/guards/role/role.guard';
import { UpsertCentreComponent } from './centre/upsert-centre/upsert-centre.component';
import { ConfirmationWindowComponent } from './confirmation-window/confirmation-window.component';
import { CtuModalComponent } from './ctu-modal/ctu-modal.component';
import { HospitalModalComponent } from './hospital-modal/hospital-modal.component';
import { UpsertNotificationComponent } from './notification/upsert-notification/upsert-notification.component';
import { OrganisationModalComponent } from './organisation-modal/organisation-modal.component';
import { PersonModalComponent } from './person-modal/person-modal.component';
import { PersonListComponent } from './person/person-list/person-list.component';
import { ProjectListComponent } from './project/project-list/project-list.component';
import { UpsertProjectComponent } from './project/upsert-project/upsert-project.component';
import { UpsertSafetyNotificationComponent } from './safety-notification/upsert-safety-notification/upsert-safety-notification.component';
import { UpsertStudyCountryComponent } from './study-country/upsert-study-country/upsert-study-country.component';
import { UpsertStudyCtuComponent } from './study-ctu/upsert-study-ctu/upsert-study-ctu.component';
import { StudyListComponent } from './study/study-list/study-list.component';
import { UpsertStudyComponent } from './study/upsert-study/upsert-study.component';
import { UpsertSubmissionComponent } from './submission/upsert-submission/upsert-submission.component';
import { UpsertReportingPeriodComponent } from './reporting-period/upsert-reporting-period/upsert-reporting-period.component';
import { WidgetsModule } from 'src/app/widgets/widgets.module';
import { UpsertVisitComponent } from './visit/upsert-visit/upsert-visit.component';


@NgModule({
    declarations: [
        ProjectListComponent,
        UpsertStudyComponent,
        ConfirmationWindowComponent,
        UpsertProjectComponent,
        UpsertStudyCtuComponent,
        UpsertCentreComponent,
        UpsertStudyCountryComponent,
        StudyListComponent,
        PersonModalComponent,
        PersonListComponent,
        OrganisationModalComponent,
        UpsertNotificationComponent,
        UpsertSubmissionComponent,
        HospitalModalComponent,
        CtuModalComponent,
        UpsertSafetyNotificationComponent,
        UpsertReportingPeriodComponent,
        UpsertVisitComponent,
    ],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        CommonModule,
        RouterModule.forChild([
            // Project details pages
            {
                path: 'projects/:id/edit',
                pathMatch: 'full',
                component: UpsertProjectComponent,
                data: {
                    shouldReuse: false,
                    key: 'upsertprojectcomponentedit'
                },
                canActivate: [RoleGuard]
            },
            {
                path: 'projects/:id/view',
                pathMatch: 'full',
                component: UpsertProjectComponent,
                data: {
                    shouldReuse: false,
                    key: 'upsertprojectcomponentview'
                }
            },
            // Studies details pages
            {
                path: 'studies/:id/edit',
                pathMatch: 'full',
                component: UpsertStudyComponent,
                data: {
                    shouldReuse: false,
                    key: 'upsertstudycomponentedit'
                },
                canActivate: [RoleGuard]
            },
            {
                path: 'studies/:id/view',
                pathMatch: 'full',
                component: UpsertStudyComponent,
                data: {
                    shouldReuse: false,
                    key: 'upsertstudycomponentview'
                }
            },
            // Study countries details pages
            {
                path: 'study-countries/:id/edit',
                pathMatch: 'full',
                component: UpsertStudyCountryComponent,
                data: {
                    shouldReuse: false,
                    key: 'upsertstudycountrycomponentedit'
                },
                canActivate: [RoleGuard]
            },
            {
                path: 'study-countries/:id/view',
                pathMatch: 'full',
                component: UpsertStudyCountryComponent,
                data: {
                    shouldReuse: false,
                    key: 'upsertstudycountrycomponentview'
                }
            },
            // Study CTUs details pages
            {
                path: 'study-ctus/:id/edit',
                pathMatch: 'full',
                component: UpsertStudyCtuComponent,
                data: {
                    shouldReuse: false,
                    key: 'upsertstudyctucomponentedit'
                },
                canActivate: [RoleGuard]
            },
            {
                path: 'study-ctus/:id/view',
                pathMatch: 'full',
                component: UpsertStudyCtuComponent,
                data: {
                    shouldReuse: false,
                    key: 'upsertstudyctucomponentview'
                }
            },
        ]),
        WidgetsModule,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
        NgbDatepickerModule,
        FormsModule,
        ReactiveFormsModule,
        MatTabsModule,
        MatExpansionModule,
        NgSelectModule,
        CalendarModule,
        NgbModule,
        NgxPermissionsModule.forChild()
    ],
    providers: [NgbActiveModal],
    exports: [StudyListComponent, ProjectListComponent]
})
export class CommonPagesModule { }
