import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import {UserInterface} from '../../../_rms/interfaces/user/user.interface';
import {AuthService} from '../../../_rms/services/auth/auth.service';
import {States} from '../../../_rms/states/states';
import {StatesService} from '../../../_rms/services/states/states.service';


@Component({
  selector: 'app-organization-information',
  templateUrl: './organization-information.component.html',
  styleUrls: ['./organization-information.component.scss']
})
export class OrganizationInformationComponent implements OnInit, OnDestroy {
  formGroup: UntypedFormGroup;
  user: UserInterface;
  firstUserState: UserInterface;
  subscriptions: Subscription[] = [];
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
    this.formGroup = this.fb.group({
      // companyName: [this.user.companyName, Validators.required],
      email: [this.user.email, Validators.compose([Validators.required, Validators.email])],
      // location: [this.user.address.city, Validators.required],
      website: [this.user.website, Validators.required],
    });
  }

  save() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }


    const formValues = this.formGroup.value;
    // prepar user
    this.user = Object.assign(this.user, {
      username: formValues.username,
      email: formValues.email,
      language: formValues.language,
      timeZone: formValues.timeZone,
      communication: {
        email: formValues.communicationEmail,
        sms: formValues.communicationSMS,
        phone: formValues.communicationPhone
      }
    });

    // Do request to your server for user update, we just imitate user update there
  }

  cancel() {
    this.user = Object.assign({}, this.firstUserState);
    this.loadForm();
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
