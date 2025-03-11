import { Component } from '@angular/core';
import { UserService } from 'src/app/_rms/services/user/user.service';
import {UserInterface} from '../../../../_rms/interfaces/user/user.interface';
import { StatesService } from 'src/app/_rms/services/states/states.service';

@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss']
})
export class ProfileCardComponent {
  user: any;
  constructor(
      public statesService: StatesService,
      private userService: UserService
  ) {
    this.getUserData();
  }
  getUserData() {
    // TODO: probably remove
    this.user = this.statesService.currentUser;
    this.user.pic = './assets/media/svg/avatars/001-boy.svg';
    this.user.companyName = '';
    this.user.address = '';
    this.user.phone = '';
  }
}
