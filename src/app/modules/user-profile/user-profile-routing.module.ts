import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EmailSettingsComponent } from './email-settings/email-settings.component';
import { PersonalInformationComponent } from './personal-information/personal-information.component';
import { UserProfileComponent } from './user-profile.component';
import {OrganizationInformationComponent} from './organization-information/organization-information.component';
import {AccountInformationComponent} from './account-information/account-information.component';

const routes: Routes = [
  {
    path: '',
    component: UserProfileComponent,
    children: [
      {
        path: 'personal-information',
        component: PersonalInformationComponent,
      },
      {
        path: 'account-information',
        component: AccountInformationComponent
      },
      {
        path: 'organization-information',
        component: OrganizationInformationComponent
      },
      {
        path: 'email-settings',
        component: EmailSettingsComponent
      },
      { path: '', redirectTo: 'personal-information', pathMatch: 'full' },
      { path: '**', redirectTo: 'personal-information', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserProfileRoutingModule { }
