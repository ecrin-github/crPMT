import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import {UserInterface} from '../../../_rms/interfaces/user/user.interface';
import {AuthService} from '../../../_rms/services/auth/auth.service';
import {StatesService} from '../../../_rms/services/states/states.service';
import {States} from '../../../_rms/states/states';


@Component({
  selector: 'app-personal-information',
  templateUrl: './personal-information.component.html',
  styleUrls: ['./personal-information.component.scss']
})
export class PersonalInformationComponent implements OnInit, OnDestroy {
  formGroup: UntypedFormGroup;
  user: UserInterface;
  firstUserState: UserInterface;
  subscriptions: Subscription[] = [];
  avatarPic = 'none';
  isLoading$: Observable<boolean>;

  constructor(
      private userService: AuthService,
      private states: States,
      private statesService: StatesService,
      private fb: UntypedFormBuilder
  ) {
    this.isLoading$ = this.states.isLoadingSubject.asObservable();
  }

  ngOnInit(): void {
    const sb = this.states.currentUser.asObservable().pipe(
      first(user => !!user)
    ).subscribe(user => {
      this.user = Object.assign({}, user);
      this.firstUserState = Object.assign({}, user);
      this.loadForm();
    });
    this.subscriptions.push(sb);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sb => sb.unsubscribe());
  }

  loadForm() {
    console.log(this.user)
    this.formGroup = this.fb.group({
      // pic: [this.user.pic],
      firstName: [this.user.firstName, Validators.required],
      lastName: [this.user.lastName, Validators.required],
      // companyName: [this.user.companyName, Validators.required],
      // phone: [this.user.phone, Validators.required],
      email: [this.user.email, Validators.compose([Validators.required, Validators.email])],
      website: [this.user.website, Validators.required]
    });
  }

  save() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }

    const formValues = this.formGroup.value;
    this.user = Object.assign(this.user, formValues);

    // Do request to your server for user update, we just imitate user update there
  }

  cancel() {
    this.user = Object.assign({}, this.firstUserState);
    this.loadForm();
  }

  getPic() {
    /*if (!this.user.pic) {
      return 'none';
    }

    return `url('${this.user.pic}')`;*/
  }

  deletePic() {
    // this.user.pic = '';
  }

  // helpers for View
  isControlValid(controlName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.valid && (control.dirty || control.touched);
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
