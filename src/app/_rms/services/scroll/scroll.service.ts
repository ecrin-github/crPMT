import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { getHeightWithoutPadding } from 'src/assets/js/util';

@Injectable()
export class ScrollService {

  scroll: any;
  isIniting: boolean = false;

  constructor(private router: Router) { }

  /**
   * urls: urls where scroll event should be fired. Used to not activate scroll on dashboard
   */
  async handleScroll(urls: Array<String>) {
    if (urls.includes(this.router.url)) {
      // Required in order to have sticky header on website arrival (or page refresh)
      this.initScroll();
    }
    this.router.events.subscribe((ev) => {
      if (!!this.scroll) {
        if (ev instanceof NavigationEnd && urls.includes(ev.urlAfterRedirects) && this.scroll.closed && !this.isIniting) {
          // Used for re-activating navigation for state-kept pages (probably)
          this.initScroll();
        } else if (!this.scroll.closed && ev instanceof NavigationEnd && !(urls.includes(ev.urlAfterRedirects))) {
          // Unsubscribing previous page scroll for state-kept pages only, others are destroyed automatically
          this.unsubscribeScroll();
        }
      }
    });
  }

  /**
   * Using a div that takes the same height as the header (in place of the non-sticky header) when transitioning to sticky header for a smooth transition (no jump)
   */
  async initScroll() {
    this.isIniting = true;

    const stickyTh = document.getElementById('navbar').offsetTop;
    // Scroll event
    this.scroll = fromEvent(document, 'scroll').subscribe((ev) => {
      const navbar = document.getElementById('navbar');
      const permanentNavbar = document.getElementById('permanentNavbar');

      // "Replacement" navbar
      if (!!permanentNavbar) {
        if (window.scrollY >= stickyTh) {
          // Showing replacement navbar if navbar sticky with same height as sticky navbar to make the non-sticky to sticky transition smooth (would jump otherwise)
          permanentNavbar.classList.add('displayPermanentNavbar');
          permanentNavbar.style.height = `${getHeightWithoutPadding(navbar)}px`;
        } else {
          // Hiding (height=0) replacement navbar if navbar not sticky
          permanentNavbar.classList.remove('displayPermanentNavbar');
          permanentNavbar.style.height = "0px";
        }
      }
      
      // "Sticky" navbar
      if (!!navbar) {
        if (window.scrollY >= stickyTh) {
          navbar.classList.add('sticky');
        } else {
          navbar.classList.remove('sticky');
        }
      }

    });

    this.isIniting = false;
  }

  unsubscribeScroll() {
    if (!!this.scroll) {
      this.scroll.unsubscribe();
    }
  }
}
