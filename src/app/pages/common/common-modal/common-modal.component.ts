import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { DtpService } from 'src/app/_rms/services/entities/dtp/dtp.service';
import { DupService } from 'src/app/_rms/services/entities/dup/dup.service';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import {HttpClient} from '@angular/common/http';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-common-modal',
  templateUrl: './common-modal.component.html',
  styleUrls: ['./common-modal.component.scss']
})
export class CommonModalComponent implements OnInit {
  studyForm: UntypedFormGroup;
  objectForm: UntypedFormGroup;
  userForm: UntypedFormGroup;
  title: string = '';
  type: string = '';
  dtpId: number;
  dupId: number;
  currentStudiesIds: any = [];
  currentObjectsIds: any = [];
  currentUsersIds: any = [];
  studyList: [] = [];
  objectList: [] = [];
  userList: [] = [];
  pageSize = 10000;

  constructor(private activeModal: NgbActiveModal, private listService: ListService, private spinner: NgxSpinnerService, 
              private toastr: ToastrService, private objectService: DataObjectService, private fb: UntypedFormBuilder,
              private dtpService: DtpService, private dupService: DupService, private httpClient: HttpClient) {
      this.studyForm = this.fb.group({
        studyId: '',
      });
      this.objectForm = this.fb.group({
        objectId: {value: '', disabled: true}
      });
      this.userForm = this.fb.group({
        person: ''
      })
    }

  ngOnInit(): void {
    if(this.type === 'study') {
      this.getStudyList();
    }
    if (this.type === 'dataObject') {
      this.getObjectListByStudy(Array.from(this.currentStudiesIds).toString());
    }
    if (this.type === 'user') {
      this.getPeopleList();
    }
    this.studyDropdownClose();
  }
  closeModal(data) {
    this.activeModal.close(data);
  }
  addDtpStudy(dtpId, payload) {
    return this.dtpService.addDtpStudy(dtpId, payload);
  }
  addDupStudy(dupId, payload) {
    return this.dupService.addDupStudy(dupId, payload);
  }
  addDtpObject(dtpId, payload) {
    return this.dtpService.addDtpObject(dtpId, payload);
  }
  addDupObject(dupId, payload) {
    return this.dupService.addDupObject(dupId, payload);
  }

  addDtpUser(dtpId, payload) {
    return this.dtpService.addDtpPerson(dtpId, payload);
  }
  addDupUser(dupId, payload) {
    return this.dupService.addDupPerson(dupId, payload);
  }

  getStudyQueries(payload) {
    let studies$: Array<Observable<any>> = [];

    if (payload?.length > 0) {
      payload.map ((item : any) => {
        if (this.dtpId) {
          studies$.push(this.addDtpStudy(this.dtpId, {dtpId: this.dtpId, study: item}));
        }
        if (this.dupId) {
          studies$.push(this.addDupStudy(this.dupId, {dupId: this.dupId, study: item}));
        }
      });

      studies$ = studies$.map((funct) => {
        return funct.pipe(catchError(error => of(this.toastr.error(error.error.title))));
      });
    }

    return studies$;
  }

  getObjectQueries(payload) {
    let dataObjects$: Array<Observable<any>> = [];

    if (payload?.length > 0) {
      payload.map((item : any) => {
        if (this.dtpId) {
          dataObjects$.push(this.addDtpObject(this.dtpId, {dtpId: this.dtpId, data_object: item}));
        }
        if (this.dupId) {
          dataObjects$.push(this.addDupObject(this.dupId, {dupId: this.dupId, data_object: item}));
        }
      });
  
      dataObjects$ = dataObjects$.map((funct) => {
        return funct.pipe(catchError(error => of(this.toastr.error(error.error.title))));
      });
    }

    return dataObjects$;
  }

  getUserQueries(payload) {
    let users$: Array<Observable<any>> = [];

    if (payload?.length > 0) {
      payload.map((item: any) => {
        if (this.dtpId) {
          users$.push(this.addDtpUser(this.dtpId, {dtpId: this.dtpId, person: item}));
        } else if (this.dupId) {
          users$.push(this.addDupUser(this.dupId, {dupId: this.dupId, person: item}));
        }
      });
      users$ = users$.map((funct) => {
        return funct.pipe(catchError(error => of(this.toastr.error(error.error.title))));
      });
    }

    return users$;
  }

  save() {
    if (this.type === 'study') {
      const studyPayload = this.studyForm.value.studyId;
      const objectPayload = this.objectForm.value.objectId;

      combineLatest([...this.getObjectQueries(objectPayload), ...this.getStudyQueries(studyPayload)]).subscribe(res => {
        res.forEach((resI: any) => {
          if (resI.statusCode === 201) {
            if (resI.dataObject) {
              this.toastr.success('Object associated successfully.');
            } else {
              this.toastr.success('Study associated successfully.');
            }
          } else {
            this.toastr.error(resI.message);
          }
        });
        this.closeModal({});
      });
    }

    if (this.type === 'dataObject') {
      const payload = this.objectForm.value.objectId;

      combineLatest(this.getObjectQueries(payload)).subscribe(res => {
        res.forEach((resI: any) => {
          if (resI.statusCode === 201) {
            this.toastr.success('Object associated successfully.');
          } else {
            this.toastr.error(resI.message);
          }
        })
        this.closeModal({});
      });
    }
    
    if (this.type === 'user') {
      const payload = this.userForm.value.person;
      
      combineLatest(this.getUserQueries(payload)).subscribe(res => {
        res.forEach((resI: any) => {
          if (resI.statusCode === 201) {
            this.toastr.success('User associated successfully.');
          } else {
            this.toastr.error(resI.message);
          }
        })
        this.closeModal({});
      });
    }
  }
  
  customSearchStudies(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.sdSid.toLocaleLowerCase().indexOf(term) > -1 || item.displayTitle.toLocaleLowerCase().indexOf(term) > -1;
  }
  customSearchObjects(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.sdOid.toLocaleLowerCase().indexOf(term) > -1 || item.displayTitle.toLocaleLowerCase().indexOf(term) > -1;
  }
  customSearchUser(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.firstName.toLocaleLowerCase().indexOf(term) > -1 || item.lastName.toLocaleLowerCase().indexOf(term) > -1;
  }

  getStudyList() {
    this.spinner.show();
    this.listService.getStudyList().subscribe((res: any) => {
      this.spinner.hide();
      if (res?.results) {
        this.studyList = res.results.filter((item: any) => {
          return (!this.currentStudiesIds.has(item?.id));
        });
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }

  getObjectListByStudy(ids) {
    this.spinner.show();
    this.listService.getObjectByMultiStudies(ids).subscribe((res: any) => {
      this.spinner.hide();
      if (res?.data) {
        this.objectList = res.data.filter((item: any) => {
          return item?.accessType?.name?.toLocaleLowerCase() === 'controlled' && !this.currentObjectsIds.has(item?.id);
        }); 
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title)
    })
  }

  getPeopleList() {
    this.spinner.show();
    this.listService.getPeopleList(this.pageSize, '').subscribe((res: any) => {
      this.spinner.hide();
      if (res?.results) {
        this.userList = res.results.filter((item: any) => {
          return (!this.currentUsersIds.has(item?.id));
        });
      }
    }, error => {
      console.log('error', error);
    })
  }

  studyDropdownClose() {
    if (this.type === 'dataObject') {
      this.objectForm.controls.objectId.enable();
    } else if (this.type === 'study') {
      if (this.studyForm.value.studyId.length) {
        this.objectForm.controls.objectId.enable();
        const sdSids = this.currentStudiesIds?.length > 0 ?
          this.studyForm.value.studyId.toString() + ',' + Array.from(this.currentStudiesIds).toString() : this.studyForm.value.studyId.toString();
        this.getObjectListByStudy(sdSids);
      } else {
        this.objectForm.controls.objectId.disable();
      }
    }
  }
}
