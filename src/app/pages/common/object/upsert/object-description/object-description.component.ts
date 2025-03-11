import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ObjectDescriptionInterface } from 'src/app/_rms/interfaces/data-object/object-description.interface';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { ObjectLookupService } from 'src/app/_rms/services/entities/object-lookup/object-lookup.service';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-object-description',
  templateUrl: './object-description.component.html',
  styleUrls: ['./object-description.component.scss']
})
export class ObjectDescriptionComponent implements OnInit {
  form: UntypedFormGroup;
  descriptionType: [] = [];
  languageCodes: [] = [];
  subscription: Subscription = new Subscription();
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  @Input() objectId: string;
  objectDescription: ObjectDescriptionInterface;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Output() emitDescription: EventEmitter<any> = new EventEmitter();
  len: any;
  isBrowsing: boolean = false;
  pageSize: number = 10000;
  
  constructor( private fb: UntypedFormBuilder, private router: Router, private commonLookupService: CommonLookupService, private objectLookupService: ObjectLookupService, private objectService: DataObjectService, private spinner: NgxSpinnerService, private toastr: ToastrService, private modalService: NgbModal) {
    this.form = this.fb.group({
      objectDescriptions: this.fb.array([])
    })
   }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    this.getDescriptionType();
    this.getLanguageCodes();
    if (this.isEdit || this.isView) {
      this.getObjectDescription();
    }
  }
  objectDescriptions(): UntypedFormArray {
    return this.form.get('objectDescriptions') as UntypedFormArray;
  }

  newObjectDescription(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      objectId: '',
      descriptionType: '',
      label: '',
      descriptionText: '',
      langCode: this.findLangCode('English'),
      alreadyExist: false
    });
  }

  addObjectDescription() {
    this.len = this.objectDescriptions().value.length;
    if (this.len) {
      if (this.objectDescriptions().value[this.len-1].descriptionType) {
        this.objectDescriptions().push(this.newObjectDescription());
      } else {
        if (this.objectDescriptions().value[this.len-1].alreadyExist) {
          this.objectDescriptions().push(this.newObjectDescription());
        } else {
          this.toastr.info('Please provide the Description Type and Description label in the previously added Object Description');
        }
      }
    } else {
      this.objectDescriptions().push(this.newObjectDescription());
    }
  }

  removeObjectDescription(i: number) {
    if(!this.objectDescriptions().value[i].alreadyExist) {
      this.objectDescriptions().removeAt(i);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.type = 'objectDescription';
      removeModal.componentInstance.id = this.objectDescriptions().value[i].id;
      removeModal.componentInstance.objectId = this.objectDescriptions().value[i].objectId;
      removeModal.result.then((data) => {
        if (data) {
          this.objectDescriptions().removeAt(i);
        }
      }, error => {})
    }
  }
  getDescriptionType() {
    this.objectLookupService.getDescriptionTypes(this.pageSize).subscribe((res: any) => {
      if(res.results) {
        this.descriptionType = res.results;
      }
    }, error => {
      console.log('error', error);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    });
  }
  getLanguageCodes() {
    this.commonLookupService.getLanguageCodes(this.pageSize).subscribe((res:any) => {
      if (res.results) {
        const { compare } = Intl.Collator('en-GB');
        this.languageCodes = res.results.sort((a, b) => compare(a.langNameEn, b.langNameEn));
      }
    }, error => {
      console.log('error', error);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    });
  }
  findLangCode(languageCode) {
    const langArr: any = this.languageCodes.filter((type: any) => type.languageCode === languageCode);
    return langArr && langArr.length? langArr[0].id : '';
  }
  getObjectDescription() {
    this.objectService.getObjectDescriptions(this.objectId).subscribe((res: any) => {
      if (res && res.results) {
        this.objectDescription = res.results.length ? res.results : [];
        this.patchForm(this.objectDescription);
      }
    }, error => {
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  patchForm(descriptions) {
    this.form.setControl('objectDescriptions', this.patchArray(descriptions));
  }
  patchArray(descriptions): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    descriptions.forEach(description => {
      formArray.push(this.fb.group({
        id: description.id,
        objectId: description.objectId,
        descriptionType: description.descriptionType ? description.descriptionType.id : null,
        label: description.label,
        descriptionText: description.descriptionText,
        langCode: description.langCode ? description.langCode.id : null,
        alreadyExist: true
      }))
    });
    return formArray;
  }
  addDescription(index) {
    this.spinner.show();
    const payload = this.form.value.objectDescriptions[index];
    payload.objectId = this.objectId;
    delete payload.id;

    this.objectService.addObjectDescription(this.objectId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 201) {
        this.toastr.success('Object Description added successfully');
        this.getObjectDescription();
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
  editDescription(descriptionObject) {
    const payload = descriptionObject.value;
    this.spinner.show();
    this.objectService.editObjectDescription(payload.id, payload.objectId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 200) {
        this.toastr.success('Object Description updated successfully');
        this.getObjectDescription();
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
  findDescriptionType(id) {
    const descriptionArray: any = this.descriptionType.filter((type: any) => type.id === id);
    return descriptionArray && descriptionArray.length ? descriptionArray[0].name : '';
  }
  findLangcodeById(id) {
    const langArr: any = this.languageCodes.filter((type: any) => type.id === id);
    return langArr && langArr.length ? langArr[0].langNameEn : '';
  }
  emitData() {
    const payload = this.form.value.objectDescriptions.map(item => {
      if (!item.id) {
        delete item.id;
      }
      if(this.objectId) {
        item.objectId = this.objectId;
      }
      return item;
    })
    this.emitDescription.emit({data: payload, isEmit: false});
  }
  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('objectdesc'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
