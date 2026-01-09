import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClipboardModule } from 'ngx-clipboard';
import { environment } from 'src/environments/environment';
// import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// Highlight JS
import { MatTableModule } from '@angular/material/table';
import { FileSaverModule } from 'ngx-filesaver';
import { HIGHLIGHT_OPTIONS, HighlightModule } from 'ngx-highlightjs';
import { NgxPermissionsModule } from 'ngx-permissions';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { SplashScreenModule } from './_rms/partials/layout/splash-screen/splash-screen.module';
// https://github.com/ng-select/ng-select/issues/1464
import { MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, MsalBroadcastService, MsalGuard, MsalGuardConfiguration, MsalInterceptor, MsalInterceptorConfiguration, MsalModule, MsalRedirectComponent, MsalService } from '@azure/msal-angular';
import { BrowserCacheLocation, IPublicClientApplication, InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { NgSelectModule } from '@ng-select/ng-select';


export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.clientId,
      authority: environment.authority,
      // Works for some reason
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      navigateToLoginRequestUrl: false,
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
