import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  today: Date = new Date();
  showFooter: boolean = true;
  appVersion: string;

  constructor( private router: Router, public oidcSecurityService: OidcSecurityService) { }

  ngOnInit(): void {
    this.appVersion = environment.appVersion;
    this.showFooter = this.router.url.includes('contactUs') ? false : true;
  }
  ngAfterViewInit(): void {
    if (environment.production) {
      document.getElementById('matomo-opt-out-icon').style.bottom = "12vh";
    }
  }
  login() {
    this.oidcSecurityService.authorize();
  }
  goToContact() {
    this.router.navigate([])
      .then(result => { window.open('/contactUs', '_self'); });
  }
  goToAbout() {
    this.router.navigate([])
    .then(result => { window.open('https://crr.gitbook.io/crdsr/', '_tab1'); });
  }
  goToUserGuide() {
  this.router.navigate([])
  .then(result => { window.open('https://crr.gitbook.io/crdsr/user-guide/', '_tab1'); });
  }
  goToBrowse() {
    this.router.navigate([])
      .then(result => { window.open('/browsing', '_self'); });
  }
  goToMdr() {
      this.router.navigate([])
      .then(result => { window.open('https://crmdr.ecrin.org/', '_blank'); });
  }
  goToLegalNotice() {
    this.router.navigate([])
    .then(result => { window.open('https://crr.gitbook.io/crr/legal-notice', '_tab1'); });
  }
  goToDataSharingPolicy() {
    this.router.navigate([])
    .then(result => { window.open('https://crr.gitbook.io/crdsr/data-sharing-policy', '_tab1'); });
  }
  goToDTP() {
    this.router.navigate([])
    .then(result => { window.open('https://crr.gitbook.io/crdsr/data-transfer-process', '_tab1'); });
  }
}
