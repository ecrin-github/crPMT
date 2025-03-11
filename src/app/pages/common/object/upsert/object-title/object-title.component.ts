import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ObjectTitleInterface } from 'src/app/_rms/interfaces/data-object/object-title.interface';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { ObjectLookupService } from 'src/app/_rms/services/entities/object-lookup/object-lookup.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-object-title',
  templateUrl: './object-title.component.html',
  styleUrls: ['./object-title.component.scss']
})
export class ObjectTitleComponent implements OnInit {
  form: UntypedFormGroup;
  languageCodes: [] = [];
  titleType: [] = [];
  subscription: Subscription = new Subscription();
  @Input() objectId: string;
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  objectTitle: ObjectTitleInterface;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Output() emitTitle: EventEmitter<any> = new EventEmitter();
  len: any;
  isBrowsing: boolean = false;
  pageSize: number = 10000;

  constructor( private fb: UntypedFormBuilder, private router: Router, private commonLookupService: CommonLookupService, private objectService: DataObjectService, private objectLookupService: ObjectLookupService, private spinner: NgxSpinnerService, private toastr: ToastrService, private modalService: NgbModal) {
    this.form = this.fb.group({
      objectTitles: this.fb.array([])
    });
   }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    this.getLanguageCodes();
    this.getTitleType();
    if (this.isEdit || this.isView) {
      this.getObjectTitle();
    }
  }
  objectTitles(): UntypedFormArray {
    return this.form.get('objectTitles') as UntypedFormArray;
  }

  newObjectTitle(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      objectId: '',
      titleType: '',
      titleText: '',
      langCode: null,
      comments: '',
      alreadyExist: false
    });
  }

  addObjectTitle() {
    this.len = this.objectTitles().value.length;
    if (this.len) {
      if (this.objectTitles().value[this.len-1].titleType && this.objectTitles().value[this.len-1].titleText) {
        this.objectTitles().push(this.newObjectTitle());
      } else {
        if (this.objectTitles().value[this.len-1].alreadyExist) {
          this.objectTitles().push(this.newObjectTitle());
        } else {
          this.toastr.info('Please provide the Title Type and Title text in the previously added Object Title');
        }
      }
    } else {
      this.objectTitles().push(this.newObjectTitle());
    }
  }

  removeObjectTitle(i: number) {
    if (!this.objectTitles().value[i].alreadyExist) {
      this.objectTitles().removeAt(i);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.type = 'objectTitle';
      removeModal.componentInstance.id = this.objectTitles().value[i].id;
      removeModal.componentInstance.objectId = this.objectTitles().value[i].objectId;
      removeModal.result.then((data) => {
        if (data) {
          this.objectTitles().removeAt(i);
        }
      }, error => {})
    }
  }
  getLanguageCodes() {
    this.commonLookupService.getLanguageCodes(this.pageSize).subscribe((res: any) => {
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
  getTitleType() {
    this.objectLookupService.getObjectTitleTypes(this.pageSize).subscribe((res:any) => {
      if(res.results) {
        this.titleType = res.results;
      }
    }, error => {
      console.log('error', error);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    });
  }
  getObjectTitle() {
    this.objectService.getObjectTitles(this.objectId).subscribe((res: any) => {
      if (res && res.results) {
        this.objectTitle = res.results.length ? res.results : [];
        this.patchForm(this.objectTitle);
      }
    }, error => {
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  patchForm(titles) {
    this.form.setControl('objectTitles', this.patchArray(titles));
  }
  patchArray(titles): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    titles.forEach(title => {
      formArray.push(this.fb.group({
        id: title.id,
        objectId: title.objectId,
        titleType: title.titleType ? title.titleType.id : null,
        titleText: title.titleText,
        langCode: title.langCode ? title.langCode : null,
        comments: title.comments,
        alreadyExist: true
      }))
    });
    return formArray;
  }
  addTitle(index) {
    this.spinner.show();
    const payload = this.form.value.objectTitles[index];
    payload.langCode = payload.langCode?.id ? payload.langCode.id : null;
    payload.objectId = this.objectId;
    delete payload.id;

    this.objectService.addObjectTitle(this.objectId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 201) {
        this.toastr.success('Object Title added successfully');
        this.getObjectTitle();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  editTitle(titleObject) {
    const payload = titleObject.value;
    payload.langCode = payload.langCode?.id ? payload.langCode.id : null;
    this.spinner.show();
    this.objectService.editObjectTitle(payload.id, payload.objectId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 200) {
        this.toastr.success('Object Title updated successfully');
        this.getObjectTitle();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  findTitleType(id) {
    const titleTypeArray: any = this.titleType.filter((type: any) => type.id === id);
    return titleTypeArray && titleTypeArray.length ? titleTypeArray[0].name : ''
  }
  findLangCode(languageCode) {
    const langArr: any = this.languageCodes.filter((type: any) => type.languageCode === languageCode);
    return langArr && langArr.length? langArr[0].id : '';
  }
  findLangcodeById(id) {
    const langArr: any = this.languageCodes.filter((type: any) => type.id === id);
    return langArr && langArr.length ? langArr[0].langNameEn : '';
  }
  customSearchLang(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.languageCode.toLocaleLowerCase().indexOf(term) > -1 || item.langNameEn.toLocaleLowerCase().indexOf(term) > -1 ||
           item.langNameFr.toLocaleLowerCase().indexOf(term) > -1 || item.langNameDe.toLocaleLowerCase().indexOf(term) > -1;
  }
  emitData() {
    const payload = this.form.value.objectTitles.map(item => {
      if (!item.id) {
        delete item.id;
      }
      if (this.objectId) {
        item.objectId = this.objectId;
      }
      return item;
    })
    this.emitTitle.emit({data: payload, isEmit: false});
  }
  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('objecttitle'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
