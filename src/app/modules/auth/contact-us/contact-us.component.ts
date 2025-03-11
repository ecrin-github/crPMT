import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit {
  contactForm: UntypedFormGroup
  reason: any;
  isSubmitted: boolean = false;

  constructor( private fb: UntypedFormBuilder, private commonLookUpService: CommonLookupService, private toastr: ToastrService, private router: Router) { 
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', Validators.required],
      confirmEmail: ['', Validators.required],
      organization: '',
      message: ['', Validators.required],
      reason: ['', Validators.required]
    })
  }

  ngOnInit(): void {
  }
  get g() { return this.contactForm.controls; }
  onChange() {
    this.reason = this.contactForm.value.reason
  }
  goToUserGuide() {
    this.router.navigate([])
    .then(result => { window.open('https://crr.gitbook.io/crr/', '_blank'); });
  }
  goToMdr() {
    this.router.navigate([])
    .then(result => { window.open('https://crmdr.ecrin.org/', '_blank'); });
  }
  goToLegalNotice() {
    this.router.navigate([])
    .then(result => { window.open('https://crr.gitbook.io/crr/legal-notice', '_blank'); });
  }
  goToPrivacy() {
    this.router.navigate([])
    .then(result => { window.open('https://crr.gitbook.io/crr/data-privacy-policy', '_blank'); });
  }
  goToLogin() {
    this.router.navigate(['/']);
  }

  private emailBuilder(
      fName: string,
      lName: string,
      organisation: string,
      email: string,
      message: string
  ): string {
    return '<b>Requestor name: </b>' + fName + ' ' + lName + '<br />' +
        '<b>Requestor organisation: </b>' + organisation + '<br />' +
        '<b>Requestor Email: </b>' + email + '<br />' +
        '<b>Requestor message:</b><br />' +
        message;
  }

  submitContact() {
    this.isSubmitted = true;
    if (this.contactForm.valid) {
      if (this.contactForm.value.email === this.contactForm.value.confirmEmail) {
        const payload = {
          recipients: 'crr@ecrin.org',
          subject: this.contactForm.value.reason,
          message: this.emailBuilder(
              this.contactForm.value.firstName,
              this.contactForm.value.lastName,
              this.contactForm.value.organization,
              this.contactForm.value.email,
              this.contactForm.value.message
          ),
          sender: this.contactForm.value.email,
          cc: this.contactForm.value.email
        }
        this.commonLookUpService.emailAPI(payload).subscribe((res: any) => {
          if (res.status === 'success') {
            this.toastr.success('Thank you for contacting us. An email has been sent to your mail address.')
          }
        }, error => {
          this.toastr.error(error.message);
        })
      } else {
        this.toastr.error('Email entered are not same. Please enter the correct email.')
      }
    }
  }
}
