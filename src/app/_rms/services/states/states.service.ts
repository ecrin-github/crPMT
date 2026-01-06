import {UserInterface} from '../../interfaces/user/user.interface';
import {Injectable} from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { 
    EventMessage, 
    EventType, 
    AuthenticationResult 
  } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class StatesService {

    public currentUser: BehaviorSubject<UserInterface> =
        new BehaviorSubject<UserInterface>(undefined);
    
    // public currentAuthRole: BehaviorSubject<string> =
    //     new BehaviorSubject<string>(this.defaultStates.defaultAuthRole);

    constructor(
        private msalService: MsalService, 
        private msalBroadcast: MsalBroadcastService
    ) {
        // TODO: should be triggered less often
        this.msalBroadcast.msalSubject$.subscribe(() => {
            this.updateUserInfo();
        });
    }

    private updateUserInfo() {
        const account = this.msalService.instance.getAllAccounts()[0];
        if (account) {
            const userInfo: UserInterface = {
                id: (account.idTokenClaims?.['oid'] as string),
                name: account.name,
                email: (account.idTokenClaims?.['email'] as string),
                isSuperuser: false
            };
            this.currentUser.next(userInfo);
        }
      }

    // set currentUser(value: UserInterface) {
    //     this.states.currentUser.next(value);
    //     this.states.currentAuthRole.next(value.isSuperuser ? 'Manager' : 'User');
    // }

    // setDefaultCurrentUser() {
    //     this.states.currentUser.next(undefined);
    // }

    // isManager(): boolean {
    //     return this.currentAuthRole === 'Manager';
    // }

    // // Current authorized user role state services
    // get currentAuthRole(): string {
    //     return this.states.currentAuthRole.value;
    // }

    // set currentAuthRole(value: string) {
    //     this.states.currentAuthRole.next(value);
    // }

    // setDefaultCurrentAuthRole() {
    //     this.states.currentAuthRole.next(undefined);
    // }
}
