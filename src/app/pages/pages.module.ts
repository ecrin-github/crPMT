// Angular components
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Pages modules
import {CommonPagesModule} from './common/common-pages.module';
import {Router, RouterModule, Routes, ROUTES} from '@angular/router';
import {StatesService} from '../_rms/services/states/states.service';


@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        RouterModule,
        CommonPagesModule
    ],
    providers: [
        {
            provide: ROUTES,
            useFactory: configPagesRoutes,
            deps: [
                StatesService,
                Router,
            ],
            multi: true
        }
    ]
})
export class PagesModule {}


export function configPagesRoutes(
    statesService: StatesService,
    router: Router
) {

    let routes: Routes = [];

    // if (statesService.currentUser) {
        // if (statesService.isInternalUser) {
            routes = [
                {
                    path: '',
                    loadChildren: () => import('./internal/internal-pages.module').then(m => m.InternalPagesModule)
                }
            ];
        // } else if (statesService.isExternalUser) {
        //     routes = [
        //         {
        //             path: '',
        //             loadChildren: () => import('./external/external-pages.module').then(m => m.ExternalPagesModule)
        //         }
        //     ];
        // } 
        // }

    return routes;
}
