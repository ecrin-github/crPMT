import { Component, OnInit, AfterViewInit } from '@angular/core';
import { LayoutService } from '../../../../_rms';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-header-mobile',
  templateUrl: './header-mobile.component.html',
  styleUrls: ['./header-mobile.component.scss'],
})
export class HeaderMobileComponent implements OnInit, AfterViewInit {
  headerLogo = '';
  asideSelfDisplay = true;
  headerMenuSelfDisplay = true;
  headerMobileClasses = '';
  headerMobileAttributes = {};

  appVersion: string;
  status: string;
  appTitle: string;

  constructor(private layout: LayoutService) { }

  ngOnInit(): void {
    // build view by layout config settings
    this.headerMobileClasses = this.layout.getStringCSSClasses('header_mobile');
    this.headerMobileAttributes = this.layout.getHTMLAttributes(
      'header_mobile'
    );

    this.headerLogo = this.getLogoUrl();
    this.asideSelfDisplay = this.layout.getProp('aside.self.display');
    this.headerMenuSelfDisplay = this.layout.getProp(
      'header.menu.self.display'
    );

    this.appVersion = environment.appVersion;
    this.appTitle = environment.appTitle;
  }

  ngAfterViewInit() {
    // Init Header Topbar For Mobile Mode
    // KTLayoutHeaderTopbar.init('kt_header_mobile_topbar_toggle');
  }

  private getLogoUrl() {
    const headerSelfTheme = this.layout.getProp('header.self.theme') || '';
    const brandSelfTheme = this.layout.getProp('brand.self.theme') || '';
    let result = 'crPMT.png';
    if (!this.asideSelfDisplay) {
      if (headerSelfTheme === 'light') {
        result = 'crPMT.png';
      }
    } else {
      if (brandSelfTheme === 'light') {
        result = 'crPMT.png';
      }
    }
    return `./assets/media/logos/${result}`;
  }
}
