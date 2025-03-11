import { NgModule } from '@angular/core';
import { Routes, RouterModule, RouteReuseStrategy } from '@angular/router';
import { LayoutComponent } from './pages/_layout/layout.component';
import {AuthGuard} from './_rms/guards/auth/auth.guard';
import { CustomRouteReuseStrategy } from "./_rms/route-strategy";


export const routes: Routes = [
  {
    path: 'browsing',
    component: LayoutComponent,
    loadChildren: () =>
    import('./pages/browsing/browsing/browsing.module').then((m) => m.BrowsingModule),
  },
  {
    path: '',
    canActivate: [AuthGuard], // enables permission in internal main page, summary study/data object/dtp/dup
    loadChildren: () =>
      import('./pages/layout.module').then((m) => m.LayoutModule),
  },
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
