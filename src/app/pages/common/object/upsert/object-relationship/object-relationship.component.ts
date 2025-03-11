import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ObjectRelationshipInterface } from 'src/app/_rms/interfaces/data-object/object-relationship.interface';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { ObjectLookupService } from 'src/app/_rms/services/entities/object-lookup/object-lookup.service';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { Router } from '@angular/router';
import { DataObjectInterface } from 'src/app/_rms/interfaces/data-object/data-object.interface';

@Component({
  selector: 'app-object-relationship',
  templateUrl: './object-relationship.component.html',
  styleUrls: ['./object-relationship.component.scss']
})
export class ObjectRelationshipComponent implements OnInit {
  form: UntypedFormGroup;
  relationshipType: [] = [];
  objectList: [] = [];
  subscription: Subscription = new Subscription();
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  @Input() objectId: string;
  objectRelation: ObjectRelationshipInterface;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Output() emitRelation: EventEmitter<any> = new EventEmitter();
  len: any;
  isBrowsing: boolean = false;
  pageSize: Number = 10000;

  constructor( private fb: UntypedFormBuilder, private router: Router, private listService: ListService, private objectLookupService: ObjectLookupService, private objectService: DataObjectService, private spinner: NgxSpinnerService, private toastr: ToastrService, private modalService: NgbModal) {
    this.form = this.fb.group({
      objectRelationships: this.fb.array([])
    });
   }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    this.getRelationshipType();
    this.getObjectList();
    if (this.isView || this.isEdit) {
      this.getObjectRelation();
    }
  }
  objectRelationships(): UntypedFormArray {
    return this.form.get('objectRelationships') as UntypedFormArray;
  }

  newObjectRelation(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      objectId: '',
      relationshipType: '',
      targetObject: '',
      alreadyExist: false
    });
  }

  addObjectRelation() {
    this.len = this.objectRelationships().value.length;
    if (this.len) {
      if (this.objectRelationships().value[this.len-1].relationshipType && this.objectRelationships().value[this.len-1].targetObject) {
        this.objectRelationships().push(this.newObjectRelation());
      } else {
        if (this.objectRelationships().value[this.len-1].alreadyExist) {
          this.objectRelationships().push(this.newObjectRelation());
        } else {
          this.toastr.info('Please provide the Relationship Type and Target Data Object in the previously added Object Relation');
        }
      }
    } else {
      this.objectRelationships().push(this.newObjectRelation());
    }
  }

  removeObjectRelation(i: number) {
    if (!this.objectRelationships().value[i].alreadyExist) {
      this.objectRelationships().removeAt(i);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop:'static'});
      removeModal.componentInstance.type = 'objectRelationship';
      removeModal.componentInstance.id = this.objectRelationships().value[i].id;
      removeModal.componentInstance.objectId = this.objectRelationships().value[i].objectId;
      removeModal.result.then((data) => {
        if (data) {
          this.objectRelationships().removeAt(i);
        }
      }, error => {})
    }
  }
  getRelationshipType() {
    this.objectLookupService.getObjectRelationshipTypes(this.pageSize).subscribe((res:any) => {
      if(res.results) {
        this.relationshipType = res.results;
      }
    }, error => {
      console.log('error', error)
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    });
  }
  getObjectRelation() {
    this.objectService.getObjectRelationships(this.objectId).subscribe((res: any) => {
      if (res && res.results) {
        this.objectRelation = res.results.length ? res.results : [];
        this.patchForm(this.objectRelation);
      }
    }, error => {
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  getObjectList() {
    this.listService.getObjectList(this.pageSize, '').subscribe((res: any) => {
      if (res && res.results) {
        this.objectList = res.results.length ? res.results : [];
      }
    }, error => {
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  patchForm(relations) {
    this.form.setControl('objectRelationships', this.patchArray(relations));
  }
  patchArray(relations): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    relations.forEach(relation => {
      formArray.push(this.fb.group({
        id: relation.id,
        objectId: relation.objectId,
        relationshipType: relation.relationshipType ? relation.relationshipType.id : null,
        targetObject: relation.targetObject ? relation.targetObject : null,
        alreadyExist: true
      }))
    });
    return formArray;
  }
  updatePayload(payload) {
    if (!payload.objectId && this.objectId) {
      payload.objectId = this.objectId;
    }
    if (payload.targetObject?.id) {
      payload.targetObject = payload.targetObject.id;
    }
  }
  addRelation(index) {
    if (this.form.value.objectRelationships[index].targetObject?.id === this.objectId) {
      this.toastr.error('Data Object can not be put in relationship to itself');
    } else {
      this.spinner.show();
      const payload = this.form.value.objectRelationships[index];
      this.updatePayload(payload);
      delete payload.id;

      this.objectService.addObjectRelationship(this.objectId, payload).subscribe((res: any) => {
        this.spinner.hide();
        if (res.statusCode === 201) {
          this.toastr.success('Object Relationship is added successfully');
          this.getObjectRelation();
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
  }
  editRelation(relationObject) {
    if (relationObject.value.targetObject?.id === this.objectId) {
      this.toastr.error('Data Object can not be put in relationship to itself');
    } else {
      const payload = relationObject.value;
      this.updatePayload(payload);
      this.spinner.show();
      this.objectService.editObjectRelationship(payload.id, payload.objectId, payload).subscribe((res: any) => {
        this.spinner.hide();
        if (res.statusCode === 200) {
          this.toastr.success('Object Relationship updated successfully');
          this.getObjectRelation();
        } else {
          this.toastr.error(res.messages[0]);
        }
      }, error => {
        this.spinner.hide();
        // this.toastr.error(error.error.title);
        const arr = Object.keys(error.error);
        arr.map((item,index) => {
          this.toastr.error(`${item} : ${error.error[item]}`);
        });
      })
    }
  }
  findRelationType(id) {
    const relationArray: any = this.relationshipType.filter((type: any) => type.id === id);
    return relationArray && relationArray.length ? relationArray[0].name : '';
  }
  emitData() {
    const payload = this.form.value.objectRelationships.map(item => {
      if (!item.id) {
        delete item.id;
      }
      if(this.objectId) {
        item.objectId = this.objectId;
      }
      return item;
    })
    this.emitRelation.emit({data: payload, isEmit: false});
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  compareDOs(do1: DataObjectInterface, do2: DataObjectInterface): boolean {
    return do1?.id == do2?.id;
  }
  customSearchDOs(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.id?.toLocaleLowerCase().indexOf(term) > -1 || item.displayTitle?.toLocaleLowerCase().indexOf(term) > -1;
  }
  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('objectrel'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }
}
