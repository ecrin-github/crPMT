import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription } from 'rxjs';
import { ObjectInstanceInterface } from 'src/app/_rms/interfaces/data-object/object-instance.interface';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { ObjectLookupService } from 'src/app/_rms/services/entities/object-lookup/object-lookup.service';
import { Router } from '@angular/router';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';

@Component({
  selector: 'app-object-instance',
  templateUrl: './object-instance.component.html',
  styleUrls: ['./object-instance.component.scss']
})
export class ObjectInstanceComponent implements OnInit {
  form: UntypedFormGroup;
  sizeUnit: [] = [];
  resourceType: [] = [];
  organizationList: []  [];
  subscription: Subscription = new Subscription();
  @Input() objectId: string;
  @Input() sdOid: string;
  @Input() controlled: string;
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  @Input() totalInstances: number;
  objectInstances: ObjectInstanceInterface;
  isBrowsing: boolean = false;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Output() emitInstance: EventEmitter<any> = new EventEmitter();
  pageSize: number = 10000;

  constructor( private fb: UntypedFormBuilder, private router: Router, private objectLookupService: ObjectLookupService, private objectService: DataObjectService, private spinner: NgxSpinnerService, private toastr: ToastrService, private modalService: NgbModal, private commonLookup: CommonLookupService) { 
    this.form = this.fb.group({
      objectInstances: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    // this.getSizeUnit();
    this.getResourceType();
    this.getOrganization();
    if (this.isEdit || this.isView) {
      this.getObjectInstances();
    }
  }

  objectInstancesForm(): UntypedFormArray {
    return this.form.get('objectInstances') as UntypedFormArray;
  }

  newObjectInstance(): UntypedFormGroup {
    this.totalInstances += 1;
    return this.fb.group({
      id: '',
      sdIid: 'DSRI-' + this.sdOid.slice(5, ) + '.' + (this.totalInstances),
      dataObject: '',
      repository: {value: '', disabled: (!this.isView ? this.controlled : false)},
      url: {value: '', disabled: (!this.isView ? this.controlled : false)},
      title: '',
      resourceType: '',
      // resourceSize: 0,
      // resourceSizeUnit: '',
      resourceComments: '',
      alreadyExist: false
    });
  }

  addObjectInstance() {
    this.objectInstancesForm().push(this.newObjectInstance());
  }

  removeObjectInstance(i: number) {
    if (!this.objectInstancesForm().value[i].alreadyExist) {
      this.objectInstancesForm().removeAt(i);
      this.totalInstances -= 1;
    } else {
      const deleteModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop:'static'});
      deleteModal.componentInstance.type = 'objectInstance';
      deleteModal.componentInstance.id = this.objectInstancesForm().value[i].id;
      deleteModal.componentInstance.objectId = this.objectInstancesForm().value[i].dataObject;
      deleteModal.result.then((data) => {
        if (data) {
          this.objectInstancesForm().removeAt(i);
        }
      }, error => {})
    }
  }

  // getSizeUnit() {
  //   this.objectLookupService.getSizeUnits(this.pageSize).subscribe((res: any) => {
  //     if(res.results) {
  //       this.sizeUnit = res.results;
  //     }
  //   }, error => {
  //     console.log('error', error);
  //     const arr = Object.keys(error.error);
  //     arr.map((item,index) => {
  //       this.toastr.error(`${item} : ${error.error[item]}`);
  //     })
  //   });
  // }

  getResourceType() {
    this.objectLookupService.getResourceTypes(this.pageSize).subscribe((res: any) => {
      if (res.results) {
        this.resourceType = res.results;
      }
    }, error => {
      console.log('error',error);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    });
  }

  getObjectInstances() {
    let instObs: Observable<Object> = null;
    if (this.isBrowsing) {
      instObs = this.objectService.getPublicObjectInstances(this.objectId, this.pageSize);
    } else {
      instObs = this.objectService.getObjectInstances(this.objectId, this.pageSize);
    }
    instObs.subscribe((res: any) => {
      if (res && res.results) {
        this.objectInstances = res.results.length ? res.results : [];
        this.patchForm(this.objectInstances);
      }
    }, error => {
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }

  patchForm(instances) {
    this.form.setControl('objectInstances', this.patchArray(instances));
  }

  patchArray(instances): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    instances.forEach(instance => {
      formArray.push(this.fb.group({
        id: instance.id,
        sdIid: instance.sdIid,
        dataObject: instance.dataObject,
        title: instance.title,
        repository: {value: instance.repository, disabled: (!this.isView ? this.controlled : false)},
        url: {value: instance.url, disabled: (!this.isView ? this.controlled : false)},
        resourceType: instance.resourceType ? instance.resourceType.id : null,
        // resourceSize: instance.resourceSize,
        // resourceSizeUnit: instance.resourceSizeUnit ? instance.resourceSizeUnit.id : null,
        resourceComments: instance.resourceComments,
        alreadyExist: true
      }))
    });
    return formArray;
  }

  updatePayload(payload) {
    console.log(payload);
    if (!payload.dataObject && this.objectId) {
      payload.dataObject = this.objectId;
    }
    if (payload.resourceType?.id) {
      payload.resourceType = payload.resourceType.id;
    }
    console.log(payload);
  }

  addInstance(index) {
    this.spinner.show();
    const payload = this.form.value.objectInstances[index];
    this.updatePayload(payload);
    delete payload.id;

    this.objectService.addObjectInstance(this.objectId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if( res.statusCode === 201) {
        this.toastr.success('Object Instance added successfully');
        this.getObjectInstances();
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

  editInstance(instanceObject) {
    this.spinner.show();
    const payload = instanceObject.value;
    this.updatePayload(payload);

    this.objectService.editObjectInstance(payload.id, payload.dataObject, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 200) {
        this.toastr.success('Object Instance updated successfully');
        this.getObjectInstances();
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

  findResourceType(id) {
    const resourceArray: any = this.resourceType.filter((type: any) => type.id === id);
    return resourceArray && resourceArray.length ? resourceArray[0].name : '';
  }

  findOrganizationType(id) {
    const orgArr: any = this.organizationList?.filter((type:any) => type.id === id);
    return orgArr && orgArr.length ? orgArr[0].defaultName : '';
  }

  // findSizeUnit(id) {
  //   const sizeArray: any = this.sizeUnit.filter((type: any) => type.id === id);
  //   return sizeArray && sizeArray.length ? sizeArray[0].name : '';
  // }

  emitData() {
    const payload = this.form.value.objectInstances.map(item => {
      if (!item.id) {
        delete item.id;
      }
      if (this.objectId) {
        item.dataObject = this.objectId;
      }
      return item;
    })
    this.emitInstance.emit({data: payload, isEmit: false});
  }

  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('objectinst' + (this.objectInstancesForm().value.length-1));
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.isView) {
      if (changes.controlled) {
        if (changes.controlled.currentValue) {  // Controlled true, disabling
          this.objectInstancesForm().controls.forEach(inst => {
            inst.get("url").disable();
            inst.get("repository").disable();
          });
        } else {  // Controlled false, enabling
          this.objectInstancesForm().controls.forEach(inst => {
            inst.get("url").enable();
            inst.get("repository").enable();
          });
        }
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}