import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ObjectIdentifierInterface } from 'src/app/_rms/interfaces/data-object/object-identifier.interface';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { ObjectLookupService } from 'src/app/_rms/services/entities/object-lookup/object-lookup.service';
import { Router } from '@angular/router';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { dateToString, stringToDate } from 'src/assets/js/util';


@Component({
  selector: 'app-object-identifier',
  templateUrl: './object-identifier.component.html',
  styleUrls: ['./object-identifier.component.scss']
})
export class ObjectIdentifierComponent implements OnInit {
  form: UntypedFormGroup;
  identifierType: [] = [];
  organizationList: [] = [];
  subscription: Subscription = new Subscription();
  @Input() objectId: string;
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  objectIdentifier: ObjectIdentifierInterface;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Output() emitIdentifier: EventEmitter<any> = new EventEmitter();
  len: any;
  isBrowsing: boolean = false;
  pageSize: Number = 10000;

  constructor( private fb: UntypedFormBuilder, private router: Router, private objectLookupService: ObjectLookupService, private objectService: DataObjectService, private spinner: NgxSpinnerService, private toastr: ToastrService, private modalService: NgbModal, private commonLookup: CommonLookupService) {
    this.form = this.fb.group({
      objectIdentifiers: this.fb.array([])
    });
   }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    this.getIdentifierType();
    this.getOrganization();
    if (this.isEdit || this.isView) {
      this.getObjectIdentifier();
    }
  }
  objectIdentifiers(): UntypedFormArray {
    return this.form.get('objectIdentifiers') as UntypedFormArray;
  }

  newObjectIdentifier(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      objectId: '',
      identifierValue: '',
      identifierType: '',
      identifierDate: '',
      identifierOrg: '',
      alreadyExist: false
    });
  }

  addObjectIdentifier() {
    this.len = this.objectIdentifiers().value.length;
    if (this.len) {
      if (this.objectIdentifiers().value[this.len-1].identifierType && this.objectIdentifiers().value[this.len-1].identifierValue) {
        this.objectIdentifiers().push(this.newObjectIdentifier());
      } else {
        if (this.objectIdentifiers().value[this.len-1].alreadyExist) {
          this.objectIdentifiers().push(this.newObjectIdentifier());
        } else {
          this.toastr.info('Please provide the Identifier Type and Identifier Value in the previously added Object Identifier');
        }
      }
    } else {
      this.objectIdentifiers().push(this.newObjectIdentifier());
    }
  }

  removeObjectIdentifier(i: number) {
    if (!this.objectIdentifiers().value[i].alreadyExist) {
      this.objectIdentifiers().removeAt(i);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.type = 'objectIdentifier';
      removeModal.componentInstance.id = this.objectIdentifiers().value[i].id;
      removeModal.componentInstance.objectId = this.objectIdentifiers().value[i].objectId;
      removeModal.result.then((data) => {
        if (data) {
          this.objectIdentifiers().removeAt(i);
        }
      }, error => {})
    }
  }
  getIdentifierType() {
    this.objectLookupService.getObjectIdentifierTypes(this.pageSize).subscribe((res:any) => {
      if(res.results) {
        this.identifierType = res.results;
      }
    }, error => {
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    });
  }
  getObjectIdentifier() {
    this.objectService.getObjectIdentifiers(this.objectId).subscribe((res: any) => {
      if (res && res.results) {
        this.objectIdentifier = res.results.length ? res.results : [];
        this.patchForm(this.objectIdentifier);
      }
    }, error => {
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  getOrganization() {
    this.commonLookup.getOrganizationList(this.pageSize).subscribe((res: any) => {
      if (res && res.results) {
        this.organizationList = res.results;
      }
    }, error => {
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  patchForm(identifiers) {
    this.form.setControl('objectIdentifiers', this.patchArray(identifiers));
  }
  patchArray(identifiers): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    identifiers.forEach(identifier => {
      formArray.push(this.fb.group({
        id: identifier.id,
        objectId: identifier.objectId,
        identifierValue: identifier.identifierValue,
        identifierType: identifier.identifierType ? identifier.identifierType.id : null,
        identifierDate: identifier.identifierDate ? stringToDate(identifier.identifierDate): '',
        identifierOrg: identifier.identifierOrg ? identifier.identifierOrg.id : null,
        alreadyExist: true
      }))
    });
    return formArray;
  }
  addIdentifier(index) {
    this.spinner.show();
    const payload = this.form.value.objectIdentifiers[index];
    payload.objectId = this.objectId;
    payload.identifierDate = new Date(this.dateToString(payload.identifierDate));
    delete payload.id;

    this.objectService.addObjectIdentifier(this.objectId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 201) {
        this.toastr.success('Object Identifier added successfully');
        this.getObjectIdentifier();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  editIdentifier(identifierObject) {
    const payload = identifierObject.value;
    payload.identifierDate = new Date(this.dateToString(payload.identifierDate));
    this.spinner.show();
    this.objectService.editObjectIdentifier(payload.id, payload.objectId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 200) {
        this.toastr.success('Object Identifier updated successfully');
        this.getObjectIdentifier();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  findIdentifierTyepe(id) {
    const identifierTypeArray: any = this.identifierType.filter((type: any) => type.id === id);
    return identifierTypeArray && identifierTypeArray.length ? identifierTypeArray[0].name : '';
  }
  findOrganization(id) {
    const orgArr: any = this.organizationList.filter((type: any) => type.id === id);
    return orgArr && orgArr.length ? orgArr[0].defaultName : '';
  }

  dateToString(date) {
    return dateToString(date);
  }

  emitData() {
    const payload = this.form.value.objectIdentifiers.map(item => {
      item.identifierDate = this.dateToString(item.identifierDate);
      if (!item.id) {
        delete item.id;
      }
      if(this.objectId) {
        item.objectId = this.objectId;
      }
      return item;
    })
    this.emitIdentifier.emit({data: payload, isEmit: false});
  }
  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('objectiden'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
