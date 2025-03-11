import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { DtpService } from 'src/app/_rms/services/entities/dtp/dtp.service';
import { DupService } from 'src/app/_rms/services/entities/dup/dup.service';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { ObjectLookupService } from 'src/app/_rms/services/entities/object-lookup/object-lookup.service';
import { ProcessLookupService } from 'src/app/_rms/services/entities/process-lookup/process-lookup.service';
import { dateToString } from 'src/assets/js/util';

@Component({
  selector: 'app-add-modal',
  templateUrl: './add-modal.component.html',
  styleUrls: ['./add-modal.component.scss']
})
export class AddModalComponent implements OnInit {
  objectList: [] = [];
  preReqForm: UntypedFormGroup;
  embargoForm: UntypedFormGroup;
  title: any;
  dtpId: any;
  dupId: any;
  preRequTypes: [] = [];
  type: any;
  todayDate: any;
  accessTypes: [] = [];
  isEmbargoRequested: boolean = false;
  pageSize: Number = 10000;

  constructor( private spinner: NgxSpinnerService, private fb: UntypedFormBuilder, private dtpService: DtpService, private toastr: ToastrService, private processLookup: ProcessLookupService,
    private activeModal: NgbActiveModal, private objectLookupService: ObjectLookupService, private dupService: DupService) { 
    this.preReqForm = this.fb.group({
      dtpDataObject: '',
      prereqType: '',
      prereqNotes: ''
    });
    this.embargoForm = this.fb.group({
      accessCheckStatusId: null,
      accessCheckBy: null,
      accessDetails: '',
      accessCheckDate: null,
      accessTypeId: null,
      downloadAllowed: false,
      embargoRegime: '',
      embargoRequested: null,
      embargoStillApplies: null,
      objectId: ''
    });
}

  ngOnInit(): void {
    const todayDate = new Date();
    this.todayDate = {year: todayDate.getFullYear(), month: todayDate.getMonth()+1, day: todayDate.getDate()};
    if (this.type === 'dtpPrereq') {
      this.getPrereqTypes();
      this.getDtpObjectList(this.dtpId);
    }
    if (this.type === 'dtpEmbargo') {
      this.getAccessType();
      this.getDtpObjectList(this.dtpId);
    }
  }
  getPrereqTypes() {
    this.processLookup.getPrereqTypes(this.pageSize).subscribe((res: any) => {
      if (res) {
        this.preRequTypes = res.results;
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  getAccessType() {
    this.objectLookupService.getAccessTypes(this.pageSize).subscribe((res: any) => {
      if(res.data) {
        this.accessTypes = res.data;
      }
    }, error => {
      this.toastr.error(error.error.title);
    });
  }
  getDtpObjectList(id) {
    this.spinner.show();
    this.dtpService.getDtpObjects(id).subscribe((res: any) => {
      this.spinner.hide();
      if (res && res.results) {
        this.objectList = res.results;
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title)
    })
  }
  getDupObjectList(id) {
    this.spinner.show();
    this.dupService.getDupObjects(id).subscribe((res: any) => {
      this.spinner.hide();
      if (res && res.data) {
        this.objectList = res.data;
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }

  customSearchFn(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.sdSid.toLocaleLowerCase().indexOf(term) > -1 || item.displayTitle.toLocaleLowerCase().indexOf(term) > -1;
  }
  onSave() {
    if (this.type === 'dtpPrereq') {
      this.spinner.show();
      const payload = this.preReqForm.value;
      payload.dtpId = this.dtpId;
      this.dtpService.addDtpObjectPrereq(this.dtpId,payload).subscribe((res: any) => {
        this.spinner.hide();
        if(res.statusCode === 201) {
          this.toastr.success('Pre-Requisite added successfully');
          this.closeModal('data');
        } else {
          this.toastr.error(res.messages[0]);
        }
      }, error => {
        this.spinner.hide();
        this.toastr.error(error.error.title);
      })
    }
    if (this.type === 'dtpEmbargo') {
      this.spinner.show();
      const payload = this.embargoForm.value;
      this.dtpService.addDtpObject(this.dtpId, payload).subscribe((res: any) => {
        this.spinner.hide();
        if (res.statusCode === 201) {
          this.toastr.success('Object Embargo added successfully');
          this.closeModal('data');
        } else {
          this.toastr.error(res.messages[0]);
        }
      }, error => {
        this.spinner.hide();
        this.toastr.error(error.error.title);
      })
    }
  }
  
  dateToString(date) {
    return dateToString(date);
  }

  closeModal(data) {
    this.activeModal.close(data);
  }

}
