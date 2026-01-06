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
    return this.oidcSecurityService.checkAuth().pipe(
      timeout(20000),
      mergeMap(async ({isAuthenticated, userData, accessToken, idToken}) => {
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
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

  urlHandler(url) {
    window.location.href = url;
  }

  logout(err?) {
    if (this.isAuthenticated) {
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
