import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { StudyIdentifierInterface } from 'src/app/_rms/interfaces/study/study-identifiers.interface';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import * as _ from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { StudyLookupService } from 'src/app/_rms/services/entities/study-lookup/study-lookup.service';
import { Router } from '@angular/router';
import { dateToString, stringToDate } from 'src/assets/js/util';

@Component({
  selector: 'app-study-identifier',
  templateUrl: './study-identifier.component.html',
  styleUrls: ['./study-identifier.component.scss']
})
export class StudyIdentifierComponent implements OnInit {
  form: UntypedFormGroup;
  identifierTypes: [] = [];
  subscription: Subscription = new Subscription();
  studyIdentifier: StudyIdentifierInterface;
  showIdentifierLinks = [];
  organizationList:[] = [];
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  @Input() studyId: string;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  len: any;
  isBrowsing: boolean = false;
  @Output() emitIdentifier: EventEmitter<any> = new EventEmitter();
  @ViewChildren("panel", { read: ElementRef }) panel: QueryList<ElementRef>;
  pageSize: Number = 10000;

  constructor( private fb: UntypedFormBuilder, private studyService: StudyService, private studyLookupService: StudyLookupService, private spinner: NgxSpinnerService, private toastr: ToastrService, private modalService: NgbModal, private router: Router, private commonLookup: CommonLookupService) { 
    this.form = this.fb.group({
      studyIdentifiers: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    this.getIdentifierType();
    this.getOrganization();
    if (this.isEdit || this.isView) {
      this.getStudyIdentifiers();
    }
  }
  studyIdentifiers(): UntypedFormArray {
    return this.form.get('studyIdentifiers') as UntypedFormArray;
  }

  newStudyIdentifier(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      studyId: '',
      identifierValue: '',
      identifierType: null,
      identifierDate: null,
      identifierLink: '',
      identifierOrg: null,
      alreadyExist: false
    });
  }

  addStudyIdentifier() {
    this.len = this.studyIdentifiers().value.length;
    if (this.len) {
      if (this.studyIdentifiers().value[this.len - 1].identifierValue !== null && this.studyIdentifiers().value[this.len - 1].identifierType !== null && this.studyIdentifiers().value[this.len - 1].identifierOrg !== null) {
        this.studyIdentifiers().push(this.newStudyIdentifier());
        this.showIdentifierLinks.push(false);
      } else {
        if (this.studyIdentifiers().value[this.len - 1].alreadyExist) {
          this.studyIdentifiers().push(this.newStudyIdentifier());
          this.showIdentifierLinks.push(false);
        } else {
          this.toastr.info('Please provide the Identifier Value, Identifier Type and Identifier Organization in the previously added Study Identifier');
        }
      }
    } else {
      this.studyIdentifiers().push(this.newStudyIdentifier());
      this.showIdentifierLinks.push(false);
    }
  }

  removeStudyIdentifier(i: number) {
    if (!this.studyIdentifiers().value[i].alreadyExist) {
      this.studyIdentifiers().removeAt(i);
      this.showIdentifierLinks.splice(i, 1);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.type = 'studyIdentifier';
      removeModal.componentInstance.id = this.studyIdentifiers().value[i].id;
      removeModal.componentInstance.studyId = this.studyIdentifiers().value[i].studyId;
      removeModal.result.then((data) => {
        if (data) {
          this.studyIdentifiers().removeAt(i);
          this.showIdentifierLinks.splice(i, 1);
        }
      }, error => {})
    }
  }
  getOrganization() {
    this.commonLookup.getOrganizationList(this.pageSize).subscribe((res: any) => {
      if (res && res.results) {
        this.organizationList = res.results;
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  getIdentifierType() {
    this.studyLookupService.getStudyIdentifierTypes(this.pageSize).subscribe((res: any) => {
      if(res && res.results) {
        this.identifierTypes = res.results;
      }
    }, error => {
      this.toastr.error(error.error.title);
    });
  }
  getStudyIdentifiers() {
    this.studyService.getStudyIdentifiers(this.studyId).subscribe((res:any) => {
      if(res && res.results) {
        this.studyIdentifier = res.results.length ? res.results : [];
        this.patchForm(this.studyIdentifier);
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  patchForm(identifiers) {
    this.form.setControl('studyIdentifiers', this.patchArray(identifiers));
  }
  patchArray(identifiers): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    identifiers.forEach((identifier, index) => {
      formArray.push(this.fb.group({
        id: identifier.id,
        studyId: identifier.studyId,
        identifierValue: identifier.identifierValue,
        identifierType: identifier.identifierType ? identifier.identifierType.id : null,
        identifierDate: identifier.identifierDate ? stringToDate(identifier.identifierDate) : '',
        identifierLink: identifier.identifierLink,
        identifierOrg: identifier.identifierOrg ? identifier.identifierOrg.id : null,
        alreadyExist: true
      }))
      const arr: any = this.identifierTypes.filter((item: any) => item.name.includes('Funder'));
      this.showIdentifierLinks[index] = arr && arr.length ? identifier.identifierType === arr[0].id ? true : false : false;
    });
    return formArray;
  }
  addIdentifier(index) {
    this.spinner.show();
    const payload = this.form.value.studyIdentifiers[index];
    payload.studyId = this.studyId;
    payload.identifierDate = new Date(this.dateToString(payload.identifierDate));
    delete payload.id;
    
    this.studyService.addStudyIdentifier(this.studyId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 201) {
        this.toastr.success('Study Identifier added successfully');
        this.getStudyIdentifiers();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }
  editIdentifier(identifierObject) {
    const payload = identifierObject.value;
    payload.identifierDate = new Date(this.dateToString(payload.identifierDate));
    this.spinner.show();
    this.studyService.editStudyIdentifier(payload.id, payload.studyId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if(res.statusCode === 200) {
        this.toastr.success('Study Identifier updated successfully');
        this.getStudyIdentifiers();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    });
  }

  dateToString(date) {
    return dateToString(date);
  }

  findIdentifierType(id) {
    const identifierTypeArray:any = this.identifierTypes.filter((type: any) => type.id === id);
    return identifierTypeArray && identifierTypeArray.length ? identifierTypeArray[0].name : ''
  }
  findOrganization(id) {
    const organizationArray: any = this.organizationList.filter((type: any) => type.id === id);
    return organizationArray && organizationArray.length ? organizationArray[0].defaultName : ''
  }
  emitData() {
    const payload = this.form.value.studyIdentifiers.map(item => {
      item.identifierDate = item.identifierDate ? this.dateToString(item.identifierDate) : ''
      if (!item.id) {
        delete item.id;
      }
      if(this.studyId) {
        item.studyId = this.studyId;
      }
      return item;
    })
    this.emitIdentifier.emit({data:payload, isEmit: false});
  }
  onChange(index) {
    const arr: any = this.identifierTypes.filter((item: any) => item.name.includes('Funder'));
    this.showIdentifierLinks[index] = arr && arr.length ? parseInt(this.form.value.studyIdentifiers[index].identifierType) === arr[0].id ? true : false : false
  }
  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('idenpanel'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
