import {States} from '../../states/states';
import {DefaultStates} from '../../states/default-states';
import {UserInterface} from '../../interfaces/user/user.interface';
import {Injectable} from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class StatesService {

    constructor(
        private states: States,
        private defaultStates: DefaultStates
    ) {
    }

    // Is loading subject services
    get isLoadingSubject(): boolean {
        return this.states.isLoadingSubject.value;
    }

    set isLoadingSubject(value: boolean) {
        this.states.isLoadingSubject.next(value);
    }

    setDefaultIsLoadingSubject() {
        this.states.isLoadingSubject.next(this.defaultStates.isLoadingSubject);
    }


    // Internal user state services
    get isInternalUser(): boolean {
        return this.states.isInternalUser.value;
    }

    set isInternalUser(value: boolean) {
        this.states.isInternalUser.next(value);
    }

    setDefaultInternalUser() {
        this.states.isInternalUser.next(this.defaultStates.defaultIsInternalUser);
    }


    // External user state services
    get isExternalUser(): boolean {
        return this.states.isExternalUser.value;
    }

    set isExternalUser(value: boolean) {
        this.states.isExternalUser.next(value);
    }

    setDefaultExternalUser() {
        this.states.isExternalUser.next(this.defaultStates.defaultIsExternalUser);
    }


    // Current user state services
    get currentUser(): UserInterface {
        return this.states.currentUser.value;
    }

    set currentUser(value: UserInterface) {
        this.states.currentUser.next(value);
        this.states.currentAuthRole.next(value.isSuperuser ? 'Manager' : 'User');
    }

    setDefaultCurrentUser() {
        this.states.currentUser.next(undefined);
    }

    // Current authorized OrgId state services
    get currentAuthOrgId(): string {
        return this.states.currentAuthOrgId.value;
    }

    set currentAuthOrgId(value: string) {
        this.states.currentAuthOrgId.next(value);
    }

    setDefaultCurrentAuthOrgId() {
        this.states.currentAuthOrgId.next(undefined);
    }

    isOrgIdValid(): boolean {
        return this.states.currentAuthOrgId.value !== 'null' 
            && this.states.currentAuthOrgId.value !== 'undefined' 
            && this.states.currentAuthOrgId.value !== null
            && this.states.currentAuthOrgId.value !== undefined
            && this.states.currentAuthOrgId.value !== '';
    }

    isManager(): boolean {
        return this.currentAuthRole === 'Manager';
    }

    // Current authorized user role state services
    get currentAuthRole(): string {
        return this.states.currentAuthRole.value;
    }

    set currentAuthRole(value: string) {
        this.states.currentAuthRole.next(value);
    }

    setDefaultCurrentAuthRole() {
        this.states.currentAuthRole.next(undefined);
    }
}
