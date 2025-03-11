import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  internalAuth: any = {
    email: 'sergei.gorianin@ecrin.org',
    password: 'admin',
  };
  externalAuth: any = {
    email: 'username@mail.org',
    password: 'username',
  };
  loginForm: UntypedFormGroup;
  hasError: boolean;
  returnUrl: string;
  isLoading$: Observable<boolean>;

  constructor(
    private router: Router,
    public oidcSecurityService: OidcSecurityService
  ) { }

  ngOnInit(): void { }

  get f() {
    return this.loginForm.controls;
  }
  login() {
    this.oidcSecurityService.authorize();
  }
  goToContact() {
    this.router.navigate(['/contactUs']);
  }
  goToBrowse() {
    this.router.navigate(['/browsing']);
  }
}
