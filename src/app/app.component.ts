import {
  Component,
  Inject,
  // ChangeDetectionStrategy,
  OnDestroy,
  OnInit,
} from '@angular/core';
// language list
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { SplashScreenService } from './_rms/partials/layout/splash-screen/splash-screen.service';
import { TableExtendedService } from './_rms/shared/crud-table';

// Required for MSAL
import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-root',
  // selector: 'body[root]',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/

  // MSAL
  title = 'PMT - MSAL';
  loginDisplay = false;
  tokenExpiration: string = '';
  private readonly _destroying$ = new Subject<void>();

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    // private translationService: TranslationService,
    private splashScreenService: SplashScreenService,
    private router: Router,
    private tableService: TableExtendedService,
  ) {
    // register translations
    // this.translationService.loadTranslations(
    //   enLang,
    // );
  }

  ngOnInit() {
    // const routerSubscription = this.router.events.subscribe((event) => {
    //   if (event instanceof NavigationEnd) {
    //     // clear filtration paginations and others
    //     this.tableService.setDefaults();
    //     // hide splash screen
    //     this.splashScreenService.hide();

    //     // scroll to top on every route change
    //     window.scrollTo(0, 0);

    //     // to display back the body content
    //     setTimeout(() => {
    //       document.body.classList.add('page-loaded');
    //     }, 500);
    //   }
    // });
    // this.unsubscribe.push(routerSubscription);

    // MSAL
    // this.msalBroadcastService.inProgress$
    //     .pipe(
    //     filter((status: InteractionStatus) => status === InteractionStatus.None),
    //     takeUntil(this._destroying$)
    //   )
    //   .subscribe(() => {
    //     this.setLoginDisplay();
    //   });

    //   // Used for storing and displaying token expiration
    //   this.msalBroadcastService.msalSubject$.pipe(filter((msg: EventMessage) => msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS)).subscribe(msg => {
    //   this.tokenExpiration=  (msg.payload as any).expiresOn;
    //   localStorage.setItem('tokenExpiration', this.tokenExpiration);
    // });
  }

  // If the user is logged in, present the user with a "logged in" experience
  // setLoginDisplay() {
  //   this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
  // }

  // Log the user in and redirect them if MSAL provides a redirect URI otherwise go to the default URI
  // login() {
  //   if (this.msalGuardConfig.authRequest) {
  //     this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest } as RedirectRequest);
  //   } else {
  //     this.authService.loginRedirect();
  //   }
  // }

  // Log the user out
  // logout() {
  //   this.authService.logoutRedirect();
  // }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  // ngOnDestroy() {
  //   this.unsubscribe.forEach((sb) => sb.unsubscribe());
  // }
}
