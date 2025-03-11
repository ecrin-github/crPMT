import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { PeopleService } from 'src/app/_rms/services/entities/people/people.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';

@Component({
  selector: 'app-upsert-user',
  templateUrl: './upsert-user.component.html',
  styleUrls: ['./upsert-user.component.scss']
})
export class UpsertUserComponent implements OnInit {
  organizationList: [] = [];
  userForm: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  id: any;
  role: any;
  userData: any;
  pageSize: Number = 10000;

  constructor(private statesService: StatesService,
    private backService: BackService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private reuseService: ReuseService,
    private peopleService: PeopleService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private commonLookup: CommonLookupService) {
    this.userForm = this.fb.group({
      firstName: '',
      lastName: '',
      profTitle: '',
      designation: '',
      organisation: '',
      isSuperuser: false,
      email: '',
      password: '',
      username: ''
    })
  }

  ngOnInit(): void {
    this.role = this.statesService.currentAuthRole;
    this.getOrganization();
    this.isEdit = this.router.url.includes('edit') ? true : false;
    this.isView = this.router.url.includes('view') ? true : false;
    if (this.isEdit || this.isView) {
      this.id = this.activatedRoute.snapshot.params.id;
      this.getPeopleById(this.id);
    }
  }

  getPeopleById(id) {
    this.spinner.show();
    this.peopleService.getPeopleById(this.id).subscribe((res: any) => {
      this.spinner.hide();
      if (res) {
        this.userData = res;
        this.patchForm(this.userData);
      }
    }, error => {
      this.spinner.hide();
    })
  }

  patchForm(userData) {
    this.userForm.patchValue({
      firstName: userData.firstName,
      lastName: userData.lastName,
      designation: userData.userProfile?.designation,
      profTitle: userData.userProfile?.profTitle,
      organisation: userData.userProfile?.organisation?.id,
      lsAaiId: userData.userProfile?.lsAaiId,
      isSuperuser: userData.isSuperuser,
      email: userData.email,
      password: userData.password,
      username: userData.username
    })
  }

  getOrganization() {
    this.spinner.show();
    this.commonLookup.getOrganizationList(this.pageSize).subscribe((res: any) => {
      this.spinner.hide();
      if (res && res.results) {
        this.organizationList = res.results;
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }

  onSave() {
    if (localStorage.getItem('updateUserList')) {
      localStorage.removeItem('updateUserList');
    }
    const payload = JSON.parse(JSON.stringify(this.userForm.value));
    if (this.userForm.valid) {
      if (this.isEdit) {
        this.spinner.show();
        const editUser$ = this.peopleService.editPeople(this.id, payload);
        let editUserProfile$: Observable<any>;
        if (this.userData.userProfile?.id) {
          editUserProfile$ = this.peopleService.editUserProfile(this.id, this.userData.userProfile?.id, payload);
        } else {
          editUserProfile$ = of(true);
        }
        const combine$ = combineLatest([editUser$, editUserProfile$]).subscribe(([userRes, userProfileRes]: [any, any]) => {
          let redirect: boolean = false;
          if (userRes.statusCode === 200) {
            this.toastr.success('Base user information updated successfully');
            localStorage.setItem('updateUserList', 'true');
            this.reuseService.notifyComponents();
            redirect = true;
          } else {
            this.toastr.error(userRes?.messages[0]);
          }
          if (userProfileRes.statusCode) {
            if (userProfileRes.statusCode === 200) {
              this.toastr.success('User profile information updated successfully');
              localStorage.setItem('updateUserList', 'true');
              this.reuseService.notifyComponents();
              if (redirect) {
                this.router.navigate([`/people/${this.id}/view`]);
              }
            } else {
              this.toastr.error(userProfileRes?.messages[0]);
            }
          } else {
            this.toastr.warning('No user profile associated to this user has been found, ' + 
                                'user profile information has not been updated (LS AAI ID, title, designation, organisation)',
                                '', { timeOut: 8000 });
          }
          this.spinner.hide();
        }, error => {
          this.spinner.hide();
          this.toastr.error(error);
        })
      } else {  // this.isAdd
        this.spinner.show();
        this.peopleService.addPeople(payload).subscribe((res: any) => {
          this.spinner.hide();
          if (res.statusCode === 200) {
            this.toastr.success('User added successfully');
            localStorage.setItem('updateUserList', 'true');
            this.reuseService.notifyComponents();
            if (res.id) {
              this.router.navigate([`/people/${res.id}/view`]);
            } else {
              this.back();
            }
          } else if (res.statusCode === 400) {
            this.toastr.error(res.message, 'Error');
          }
        }, error => {
          this.spinner.hide();
          this.toastr.error(error.error.title);
        })
      }
    }
  }

  back(): void {
    this.backService.back();
  }

  findOrganization(id) {
    const organizationArray: any = this.organizationList.filter((item: any) => item.id === id);
    return organizationArray && organizationArray.length ? organizationArray[0].defaultName : '';
  }

}
