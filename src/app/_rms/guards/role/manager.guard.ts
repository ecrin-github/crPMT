import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { StatesService } from '../../services/states/states.service';


@Injectable({ providedIn: 'root' })
export class ManagerGuard implements CanActivate {
  /* Use this guard when needing to check if user is logged in and authorized to see a certain page (corresponding orgId or Manager) */
  constructor(
    private statesService: StatesService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return false;
    // return this.statesService.isManager();
    
    /*return this.authService.isAuthenticUser().pipe(
      timeout(10000),
      mergeMap((isAuthentic: boolean) => {
        return of(isAuthentic && this.statesService.isManager())
      }),
      catchError(err => {
        this.toastr.error(err.message, 'Authorization error');
        return of(false);
      })
    );*/
  }
}
