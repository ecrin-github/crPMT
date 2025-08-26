// Angular modules
import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatButtonModule} from '@angular/material/button';
import {NgbActiveModal, NgbDatepickerModule, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {RouterModule, RouteReuseStrategy} from '@angular/router';
import {CalendarModule} from 'primeng/calendar';

// Pages
import {ContextPageComponent} from './context-page/context-page.component';
import {NewContextComponent} from './context-page/new-context/new-context.component';
import {StudiesContextComponent} from './context-page/studies-context/studies-context.component';
import {ObjectsContextComponent} from './context-page/objects-context/objects-context.component';
// import {ViewDupComponent} from './dup/view/view-dup.component';
// import {ViewDtpComponent} from './dtp/view/view-dtp.component';
// import {EditStudyComponent} from './study/edit/edit-study.component';
// import {ViewStudyComponent} from './study/view/view-study.component';
// import {EditObjectComponent} from './object/edit/edit-object.component';
// import {ViewObjectComponent} from './object/view/view-object.component';
// import {EditDtpComponent} from './dtp/edit/edit-dtp.component';
// import {EditDupComponent} from './dup/edit/edit-dup.component';
import { SummaryDtpComponent } from './dtp/summary-dtp/summary-dtp.component';
import { UpsertDtpComponent } from './dtp/upsert-dtp/upsert-dtp.component';
import { SummaryDupComponent } from './dup/summary-dup/summary-dup.component';
import { UpsertDupComponent } from './dup/upsert-dup/upsert-dup.component';
import { SummaryObjectComponent } from './object/summary-object/summary-object.component';
import { UpsertObjectComponent } from './object/upsert/upsert-object/upsert-object.component';
import { ProjectListComponent } from './project/project-list/project-list.component';
import { UpsertStudyComponent } from './study/upsert-study/upsert-study.component';
import { ObjectInstanceComponent } from './object/upsert/object-instance/object-instance.component';
import { ObjectTitleComponent } from './object/upsert/object-title/object-title.component';
import { ObjectDateComponent } from './object/upsert/object-date/object-date.component';
import { ObjectContributorComponent } from './object/upsert/object-contributor/object-contributor.component';
import { ObjectTopicComponent } from './object/upsert/object-topic/object-topic.component';
import { ObjectIdentifierComponent } from './object/upsert/object-identifier/object-identifier.component';
import { ObjectDescriptionComponent } from './object/upsert/object-description/object-description.component';
import { ObjectRightComponent } from './object/upsert/object-right/object-right.component';
import { ObjectRelationshipComponent } from './object/upsert/object-relationship/object-relationship.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModalComponent } from './common-modal/common-modal.component';
import { ConfirmationWindowComponent } from './confirmation-window/confirmation-window.component';
import { ConfirmationWindow1Component } from './confirmation-window1/confirmation-window1.component';
import { NgxPermissionsModule } from 'ngx-permissions';
import { SummaryUserComponent } from './user/summary-user/summary-user/summary-user.component';
import { AddModalComponent } from './add-modal/add-modal.component';
import { UpsertUserComponent } from './user/upsert/upsert-user/upsert-user.component';
import { RoleGuard } from 'src/app/_rms/guards/role/role.guard';
import { ManagerGuard } from 'src/app/_rms/guards/role/manager.guard';
import { UpsertProjectComponent } from './project/upsert-project/upsert-project.component';
import { UpsertStudyCtuComponent } from './study-ctu/upsert-study-ctu/upsert-study-ctu.component';
import { UpsertCentreComponent } from './centre/upsert-centre/upsert-centre.component';
import { UpsertStudyCountryComponent } from './study-country/upsert-study-country/upsert-study-country.component';
import { StudyListComponent } from './study/study-list/study-list.component';
import { PersonModalComponent } from './person-modal/person-modal.component';
import { PersonListComponent } from './person/person-list/person-list.component';
import { OrganisationModalComponent } from './organisation-modal/organisation-modal.component';


@NgModule({
    declarations: [
        ContextPageComponent,
        NewContextComponent,
        StudiesContextComponent,
        ObjectsContextComponent,

        // ViewDtpComponent,
        // EditDtpComponent,

        // ViewDupComponent,
        // EditDupComponent,

        // EditStudyComponent,
        // ViewStudyComponent,

        // EditObjectComponent,
        // ViewObjectComponent,
        SummaryDtpComponent,
        UpsertDtpComponent,
        SummaryDupComponent,
        UpsertDupComponent,
        SummaryObjectComponent,
        UpsertObjectComponent,
        ProjectListComponent,
        UpsertStudyComponent,
        ObjectInstanceComponent,
        ObjectTitleComponent,
        ObjectDateComponent,
        ObjectContributorComponent,
        ObjectTopicComponent,
        ObjectIdentifierComponent,
        ObjectDescriptionComponent,
        ObjectRightComponent,
        ObjectRelationshipComponent,
        CommonModalComponent,
        ConfirmationWindowComponent,
        ConfirmationWindow1Component,
        SummaryUserComponent,
        AddModalComponent,
        UpsertUserComponent,
        UpsertProjectComponent,
        UpsertStudyCtuComponent,
        UpsertCentreComponent,
        UpsertStudyCountryComponent,
        StudyListComponent,
        PersonModalComponent,
        PersonListComponent,
        OrganisationModalComponent
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
        ]),
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
    exports: [ SummaryDtpComponent, SummaryDupComponent, StudyListComponent, ProjectListComponent, SummaryObjectComponent, SummaryUserComponent]
})
export class CommonPagesModule {}
