import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {InlineSVGModule} from 'ng-inline-svg';
import {NgbDropdownModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {CRUDTableModule} from '../../_rms/shared/crud-table';
import {UserProfileComponent} from './user-profile.component';
import {PersonalInformationComponent} from './personal-information/personal-information.component';
import {OrganizationInformationComponent} from './organization-information/organization-information.component';
import {EmailSettingsComponent} from './email-settings/email-settings.component';
import {UserProfileRoutingModule} from './user-profile-routing.module';
import {ProfileCardComponent} from './_components/profile-card/profile-card.component';
import {AccountInformationComponent} from './account-information/account-information.component';

@NgModule({
  declarations: [
    UserProfileComponent,
    PersonalInformationComponent,
    AccountInformationComponent,
    OrganizationInformationComponent,
    EmailSettingsComponent,
    ProfileCardComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    CRUDTableModule,
    FormsModule,
    ReactiveFormsModule,
    InlineSVGModule,
    UserProfileRoutingModule,
    NgbDropdownModule,
    NgbTooltipModule,
  ]
})
export class UserProfileModule {}
