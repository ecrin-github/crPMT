import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListUpdateService {
  private listRefreshSource = new Subject<boolean>();
  public listRefresh$ = this.listRefreshSource.asObservable();

  sendListRefresh() {
    this.listRefreshSource.next(true);
  }
}
