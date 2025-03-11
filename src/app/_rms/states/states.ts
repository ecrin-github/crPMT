import {DefaultStates} from './default-states';
import {BehaviorSubject} from 'rxjs';
import {UserInterface} from '../interfaces/user/user.interface';
import {Injectable} from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class States {
    constructor(
        private defaultStates: DefaultStates
    ) {
    }

    public isLoadingSubject: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(this.defaultStates.isLoadingSubject);

    public isInternalUser: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(this.defaultStates.defaultIsInternalUser);
    public isExternalUser: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(this.defaultStates.defaultIsExternalUser);

    public currentUser: BehaviorSubject<UserInterface> =
        new BehaviorSubject<UserInterface>(this.defaultStates.defaultCurrentUser);
    
    public currentAuthOrgId: BehaviorSubject<string> =
        new BehaviorSubject<string>(this.defaultStates.defaultAuthOrgId);
    
    public currentAuthRole: BehaviorSubject<string> =
        new BehaviorSubject<string>(this.defaultStates.defaultAuthRole);

}
