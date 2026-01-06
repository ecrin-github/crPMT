import { NgModule } from '@angular/core';
import { Routes, RouterModule, RouteReuseStrategy } from '@angular/router';
import { LayoutComponent } from './pages/_layout/layout.component';
import {AuthGuard} from './_rms/guards/auth/auth.guard';
import { CustomRouteReuseStrategy } from "./_rms/route-strategy";

// MsalGuard is required to protect routes and require authentication before accessing protected routes
import { MsalGuard, MsalRedirectComponent } from '@azure/msal-angular';


export const routes: Routes = [
  {
    path: '',
    canActivate: [
      MsalGuard
    ], // requires login for all pages except login essentially
    // Note: any page other than /login will prompt 
    // the Microsoft login screen instead of redirecting to /login
    loadChildren: () =>
      import('./pages/layout.module').then((m) => m.LayoutModule),
  },
  // { path: 'login', component: MsalRedirectComponent }, // no MsalGuard here
  {
    path: '',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'error',
    loadChildren: () =>
      import('./modules/errors/errors.module').then((m) => m.ErrorsModule),
  },
  { path: '**', redirectTo: 'error/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: "enabled",
  })],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy }]
})
export class AppRoutingModule { }
