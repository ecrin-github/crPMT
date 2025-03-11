import { Component, OnInit } from '@angular/core';
import {StatesService} from "../../../_rms/services/states/states.service";
import {UserInterface} from "../../../_rms/interfaces/user/user.interface";

@Component({
  selector: 'app-main-page-external',
  templateUrl: './external-main-page.component.html',
  styleUrls: ['./external-main-page.component.scss']
})
export class ExternalMainPageComponent implements OnInit {

  user: UserInterface;

  constructor(private stateService: StatesService) { }

  ngOnInit(): void {
    this.user = this.stateService.currentUser;
  }
}
