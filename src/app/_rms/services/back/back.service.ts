import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class BackService {

  fromEdit: boolean = false;  // workaround to not refresh on view after back from edit without history

  constructor(private location: Location, 
              private router: Router) { }

  back(): void {
    const state: { [k: string]: any; } = this.location.getState();
    // navigationId counts the number of pages visited for the current site
    if (typeof state == 'object' && state != null && 'navigationId' in state && (parseInt(state['navigationId'], 10) > 1) && !this.fromEdit) {
      this.location.back();
    } else {
      if (this.fromEdit) {
        this.fromEdit = false;
      }
      const regAction = new RegExp(/[^\/\\]+$/);  // matches the action for an upsert route (view, edit, add)
      const matchAction = regAction.exec(this.router.url);
      if (matchAction[0] === 'edit') {  // navigate to view if coming from edit
        const regView = new RegExp(/.+[\/\\](?=[^\/\\]+$)/);  // matches everything except the action
        const matchView = regView.exec(this.router.url);
        this.fromEdit = true;
        this.router.navigate([matchView[0], 'view']); // skipLocationChange to avoid going to edit on view back
      } else {
        if (!this.router.url.includes('browsing')) {
          const regSummary = new RegExp(/(?<=^[\/\\])[^\/\\]+/);  // matches the string between the first two slashes
          const match = regSummary.exec(this.router.url);
          if (match) {
            this.router.navigate(match);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.router.navigate(['/browsing']);
        }
      }
    }
  }

}
