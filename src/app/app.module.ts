import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ClipboardModule } from 'ngx-clipboard';
// import { TranslateModule } from '@ngx-translate/core';
import { InlineSVGModule } from 'ng-inline-svg';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// Highlight JS
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import { SplashScreenModule } from './_rms/partials/layout/splash-screen/splash-screen.module';
import { AbstractSecurityStorage, AuthModule, LogLevel } from 'angular-auth-oidc-client';
import { AuthGuard } from './_rms/guards/auth/auth.guard';
import { StorageService } from './_rms/services/storage/storage.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { NgxPermissionsModule } from 'ngx-permissions';
import { FileSaverModule } from 'ngx-filesaver';
import { MatTableModule } from '@angular/material/table';
// https://github.com/ng-select/ng-select/issues/1464
import { NgSelectModule } from '@ng-select/ng-select';
import { MsalModule, MsalService, MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG, MsalGuard, MsalInterceptor, MsalGuardConfiguration, MsalInterceptorConfiguration, MsalRedirectComponent, MsalBroadcastService } from '@azure/msal-angular';
import { BrowserCacheLocation, IPublicClientApplication, InteractionType, PublicClientApplication } from '@azure/msal-browser';


export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.clientId,
      authority: environment.authority,
      redirectUri: "http://localhost:4200",
      postLogoutRedirectUri: "http://localhost:4200",
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
  });
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();

  // API Calls after login
  protectedResourceMap.set(environment.baseUrlApi, [
    `api://${environment.apiClientId}/access_as_user`,
    // 'openid', 'profile', 'email'
  ]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      // scopes: ["user.read", 'openid', 'profile', 'email', `${environment.apiClientId}/access_as_user`],
      scopes: ['openid', 'profile', 'email', `api://${environment.apiClientId}/access_as_user`],
    },
    // loginFailedRoute: "/",
  };
}


@NgModule({
  declarations: [
    // Main component(s) declaration
    AppComponent
  ],
  imports: [
    NgSelectModule,
    BrowserModule,
    BrowserAnimationsModule,
    SplashScreenModule,
    HttpClientModule,
    // TranslateModule.forRoot(),
    HighlightModule,
    ClipboardModule,
    FileSaverModule,
    MatTableModule,
    AppRoutingModule,
    InlineSVGModule.forRoot(),
    NgbModule,
    NgxSpinnerModule,
    ToastrModule.forRoot(),
    MsalModule.forRoot(
      MSALInstanceFactory(),  // Factory returns IPublicClientApplication
      MSALGuardConfigFactory(),
      MSALInterceptorConfigFactory()
      // { interactionType: InteractionType.Redirect },
      // { interactionType: InteractionType.Redirect }
    ),
    // MsalModule.forRoot(new PublicClientApplication(msalConfig), msalGuardConfig, msalInterceptorConfig),
    // AuthModule.forRoot({
    //   config: {
    //     authority: environment.authority,
    //     redirectUrl: window.location.origin,
    //     postLogoutRedirectUri: window.location.origin,
    //     clientId: environment.clientId,
    //     scope: `openid profile email offline_access`,
    //     responseType: 'code',
    //     silentRenew: true,
    //     useRefreshToken: true,
    //     autoUserInfo: false,  // Cannot call Microsoft userinfo endpoint from front-end (CORS)
    //     disableIatOffsetValidation: true,
    //     logLevel: environment.production ? LogLevel.Error : LogLevel.Debug,
    //     renewTimeBeforeTokenExpiresInSeconds: 100,
    //     ignoreNonceAfterRefresh: true,
    //   },
    // }),
    NgxPermissionsModule.forRoot()
  ],
  exports: [
    NgxSpinnerModule
  ],
  providers: [
    MsalGuard,
    MsalBroadcastService,
    MsalService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
    // {
    //   provide: AbstractSecurityStorage, 
    //   useClass: StorageService
    // },
    // AuthGuard,
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: MyinterceptorInterceptor,
    //   multi: true,
    // },
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        languages: {
          xml: () => import('highlight.js/lib/languages/xml'),
          typescript: () => import('highlight.js/lib/languages/typescript'),
          scss: () => import('highlight.js/lib/languages/scss'),
          json: () => import('highlight.js/lib/languages/json')
        },
      },
    }
  ],
  bootstrap: [AppComponent, MsalRedirectComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
