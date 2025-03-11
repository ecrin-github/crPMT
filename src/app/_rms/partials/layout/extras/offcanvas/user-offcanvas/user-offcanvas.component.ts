import { Component, OnInit } from '@angular/core';
import { LayoutService } from '../../../../../../_rms';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { AuthService } from 'src/app/_rms/services/auth/auth.service';


@Component({
  selector: 'app-user-offcanvas',
  templateUrl: './user-offcanvas.component.html',
  styleUrls: ['./user-offcanvas.component.scss'],
})
export class UserOffcanvasComponent implements OnInit {
  extrasUserOffcanvasDirection = 'offcanvas-right';
  userData: any;

  constructor(
    private layout: LayoutService,
    private statesService: StatesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.extrasUserOffcanvasDirection = `offcanvas-${this.layout.getProp(
      'extras.user.offcanvas.direction'
    )}`;
    this.getUserData();
  }
  getUserData() {
    // TODO
    this.userData = this.statesService.currentUser;
    this.userData.pic = './assets/media/svg/avatars/001-boy.svg';
    this.userData.occupation = '';
  }

  logout() {
    this.authService.logout();
  }
}
