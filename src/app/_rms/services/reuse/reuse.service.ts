import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReuseService {

  constructor(private router: Router) { }

  private _notification$ = new Subject<string>();

  get notification$(): Observable<any> {
    return this._notification$.asObservable();
  }

  notifyComponents(): void {
    const regex = new RegExp(/^[\/\\][^\/\\]*/);  // matches the string between the first two slashes
    const match = regex.exec(this.router.url);
    this._notification$.next(!!match ? match[0] : '');
  }
}
