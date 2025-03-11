import {Injectable} from '@angular/core';
import {EXTERNAL_ROLES, INTERNAL_ROLES} from '../../configs/roles';
import {UserInterface} from '../../interfaces/user/user.interface';
import {StatesService} from '../states/states.service';
import {Router} from '@angular/router';


@Injectable({
    providedIn: 'root'
})
export class PrivilegesService {

    constructor(
        private router: Router,
        private statesService: StatesService
    ) {}

    /*setPrivileges(currentUser: UserInterface) {
        if (currentUser) {
            if (INTERNAL_ROLES.find(role => role.id === currentUser.role)) {
                this.statesService.isInternalUser = true;
                this.statesService.isExternalUser = false;
            }
            if (EXTERNAL_ROLES.find(role => role.id === currentUser.role)) {
                this.statesService.isInternalUser = false;
                this.statesService.isExternalUser = true;
            }
        } else {
            this.statesService.isInternalUser = false;
            this.statesService.isExternalUser = false;
            this.router.navigate(['/login'], {
                queryParams: {},
            });
        }
    }*/
}
