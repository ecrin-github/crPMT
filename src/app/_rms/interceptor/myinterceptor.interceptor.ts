import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
  HttpContextToken
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { switchMap, tap } from 'rxjs/operators';
export const BYPASS_LOG = new HttpContextToken(() => false);

@Injectable()
export class MyinterceptorInterceptor implements HttpInterceptor {

  constructor(private oidcSecurityService: OidcSecurityService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.oidcSecurityService.getAccessToken().pipe(
      switchMap(token => {
        let newRequest = request;
        if (!request.url.includes('https://login.elixir-czech.org/oidc')) {
          if (!request.context.get(BYPASS_LOG)) {
            newRequest = request.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
              },
              url: request.url
            });
          }
        }

        return next.handle(newRequest);
      })
    );
    /*
    // Legacy code from angular-auth-oidc-client <= v13
    let token = this.oidcSecurityService.getAccessToken();
    let path = '';
    if (!request.url.includes('https://login.elixir-czech.org/oidc')) {
      path += request.url;
      if (request.context.get(BYPASS_LOG) === true) {

      } else {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
          url: path
        })
      }
    } else {
      path = request.url;
    }
    return next.handle(request).pipe(tap(event => {
      if (event instanceof HttpResponse) {

      }
    }, error => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 || error.status === 404) {
          // localStorage.clear();
          // document.location.reload();
        }
      }
    }
    ));*/
  }
}
