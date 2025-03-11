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
import { MyinterceptorInterceptor } from './_rms/interceptor/myinterceptor.interceptor';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { NgxPermissionsModule } from 'ngx-permissions';
import { FileSaverModule } from 'ngx-filesaver';
import { MatTableModule } from '@angular/material/table';


@NgModule({
  declarations: [
    // Main component(s) declaration
    AppComponent
  ],
  imports: [
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
    AuthModule.forRoot({
      config: {
        authority: environment.authority,
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: environment.clientId,
        scope: 'openid profile email offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        logLevel: environment.production ? LogLevel.Error : LogLevel.Debug,
        renewTimeBeforeTokenExpiresInSeconds: 100,
        ignoreNonceAfterRefresh: true,
      },
    }),
    NgxPermissionsModule.forRoot()
  ],
  exports: [
    NgxSpinnerModule
  ],
  providers: [
    {
      provide: AbstractSecurityStorage, 
      useClass: StorageService
    },
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MyinterceptorInterceptor,
      multi: true,
    },
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
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
