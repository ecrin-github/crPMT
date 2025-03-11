import {Injectable} from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class DefaultStates {

    public isLoadingSubject = false;

    public defaultIsInternalUser = false;
    public defaultIsExternalUser = false;

    public defaultCurrentUser = undefined;
    public defaultAuthOrgId = undefined;
    public defaultAuthRole = undefined;
}
