import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map, catchError, mergeMap, timeout } from 'rxjs/operators';
import { ToastrService  } from 'ngx-toastr';
import { Router } from '@angular/router';
import { UserInterface } from '../../interfaces/user/user.interface';
import { StatesService } from '../states/states.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { UserService } from '../user/user.service';
import { LsAaiUserInterface } from '../../interfaces/user/ls-aai/ls-aai.user.interface';
import { NgxPermissionsService } from 'ngx-permissions';
// import { WebSocketService } from '../notifications/websocket.service';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // public fields
  isAuthenticated: boolean;

  constructor(
    private statesService: StatesService,
    private permissionService: NgxPermissionsService, 
    private router: Router,
    private oidcSecurityService: OidcSecurityService,
    private userService: UserService,
    private toastr: ToastrService,
    // private webSocketService: WebSocketService,
  ) { }

  isAuthenticUser() {
    /* TODO: checkAuth only checks that the locally stored tokens are valid when logged in, doesn't query LS AAI again
       there should be a separate use case for handling logging out (and choosing to stay logged in on logout page)*/
    return this.oidcSecurityService.checkAuth().pipe(
      timeout(20000),
      mergeMap(async ({isAuthenticated, userData, accessToken, idToken}) => {
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          // Note: userData in checkAuth result is obtained from localStorage (and therefore can be tampered with), so we have to query LS AAI again
          // Note 2: querying LS AAI even if statesService.currentUser is set for added security (preventing client-side memory tampering)
          await this.getUser();
          // this.webSocketService.startConnection();
        } else {
          this.logout();
        }
        return isAuthenticated;
      }),
      catchError(err => {
        this.logout(err);
        return of(false);
      })
    );
  }

  getUser() {
    /* Get user from LS and get role and organisation from our DB. Setting user and permissions as well. */
    this.statesService.isLoadingSubject = true;
    return this.userService.getUser()
      .pipe(
        timeout(10000),
        mergeMap((userDataClean: LsAaiUserInterface) => {
          return this.userService.getUserRoleInfo(userDataClean);
        }),
        map((user: UserInterface) => {
          this.statesService.currentUser = user;
          this.permissionService.loadPermissions([this.statesService.currentAuthRole]);
        }),
        catchError(err => {
          this.logout(err);
          return of(false);
        })
      ).toPromise();
  }

  urlHandler(url) {
    window.location.href = url;
  }

  logout(err?) {
    if (this.isAuthenticated) {
      // To use when logging out is handled better (see comment in isAuthenticUser())
      // this.oidcSecurityService.logoff('', {urlHandler: this.urlHandler}).subscribe((res2) => {
        // localStorage.clear();
      // });
      // this.webSocketService.close();
      this.oidcSecurityService.logoff().subscribe();
    } else {
      localStorage.clear();
      if (err) {
        this.toastr.error(err.message, 'Logout error');
      }
      this.router.navigate(['login']);
    }
  }
}
