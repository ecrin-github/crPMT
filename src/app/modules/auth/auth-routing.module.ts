import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthComponent} from './auth.component';
import {LoginComponent} from './login/login.component';
import {LogoutComponent} from './logout/logout.component';
// import { UserGuideComponent } from './user-guide/user-guide.component';


const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: AuthComponent,
        // data: {returnUrl: window.location.pathname}
      },
      // {
      //   path: 'contactUs',
      //   component: ContactUsComponent
      // },
      // {
      //   path: 'user-guide',
      //   component: UserGuideComponent
      // },
      {
        path: 'logout',
        component: LogoutComponent
      },
      {path: '', redirectTo: 'login', pathMatch: 'full'},
      {path: '**', redirectTo: 'login', pathMatch: 'full'},
    ]
  }
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ]
})
export class AuthRoutingModule {}
