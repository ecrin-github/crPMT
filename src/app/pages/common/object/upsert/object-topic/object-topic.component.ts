import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ObjectTopicInterface } from 'src/app/_rms/interfaces/data-object/object-topic.interface';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { Router } from '@angular/router';
import { TopicVocabularies } from 'src/app/_rms/interfaces/context/topic-vocabularies/topic-vocabularies';

@Component({
  selector: 'app-object-topic',
  templateUrl: './object-topic.component.html',
  styleUrls: ['./object-topic.component.scss']
})
export class ObjectTopicComponent implements OnInit {
  form: UntypedFormGroup;
  topicType: [] = [];
  subscription: Subscription = new Subscription();
  @Input() objectId: string;
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  objectTopic: ObjectTopicInterface;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Output() emitTopic: EventEmitter<any> = new EventEmitter();
  len: any;
  controlledTerminology = [];
  isBrowsing: boolean = false;
  pageSize: Number = 10000;

  constructor( private fb: UntypedFormBuilder,private router: Router, private commonLookupService: CommonLookupService, private spinner: NgxSpinnerService, private toastr: ToastrService, private objectService: DataObjectService, private modalService: NgbModal) {
    this.form = this.fb.group({
      objectTopics: this.fb.array([])
    });
   }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    this.getTopicType();
    this.getTopicVocabularies();
    if (this.isView || this.isEdit) {
      this.getObjectTopic();
    }
  }
  objectTopics(): UntypedFormArray {
    return this.form.get('objectTopics') as UntypedFormArray;
  }

  newObjectTopic(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      objectId: '',
      topicType: '',
      meshCoded: false,
      meshCode: '',
      meshValue: '',
      meshQualcode: '',
      meshQualvalue: '',
      originalValue: '',
      alreadyExist: false
    });
  }

  addObjectTopic() {
    this.len = this.objectTopics().value.length;
    if (this.len) {
      if (this.objectTopics().value[this.len-1].topicType && this.objectTopics().value[this.len-1].meshValue) {
        this.objectTopics().push(this.newObjectTopic());
      } else {
        if (this.objectTopics().value[this.len-1].alreadyExist) {
          this.objectTopics().push(this.newObjectTopic());
        } else {
          this.toastr.info('Please provide the Topic Type and Topic Value in the previously added Object Topic');
        }
      }
    } else {
      this.objectTopics().push(this.newObjectTopic());
    }
  }

  removeObjectTopic(i: number) {
    if (!this.objectTopics().value[i].alreadyExist) {
      this.objectTopics().removeAt(i);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.type = 'objectTopic';
      removeModal.componentInstance.id = this.objectTopics().value[i].id;
      removeModal.componentInstance.objectId = this.objectTopics().value[i].objectId;
      removeModal.result.then((data) => {
        if (data) {
          this.objectTopics().removeAt(i);
        }
      }, error => {})
    }
  }
  getTopicType() {
    this.commonLookupService.getTopicTypes(this.pageSize).subscribe((res: any) => {
      if (res.results) {
        this.topicType = res.results;
      }
    }, error => {
      console.log('error', error);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    });
  }
  getTopicVocabularies() {
    this.commonLookupService.getTopicVocabularies(this.pageSize).subscribe((res: any) => {
      if (res.results) {
        this.controlledTerminology = res.results;
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  findTopicVocabulary(id) {
    const arr: any = this.controlledTerminology.filter((item: any) => item.id === id);
    return arr && arr.length ? arr[0].name : 'None';
  }
  getObjectTopic() {
    this.objectService.getObjectTopics(this.objectId).subscribe((res: any) => {
      if (res && res.results) {
        this.objectTopic = res.results.length ? res.results : [];
        this.patchForm(this.objectTopic);
      }
    }, error => {
      // this.toastr.error(error.error.title);
      const arr = Object.keys(error.error);
      arr.map((item,index) => {
        this.toastr.error(`${item} : ${error.error[item]}`);
      })
    })
  }
  patchForm(topics) {
    this.form.setControl('objectTopics', this.patchArray(topics));
  }
  patchArray(topics): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    topics.forEach(topic => {
      formArray.push(this.fb.group({
        id: topic.id,
        objectId: topic.objectId,
        topicType: topic.topicType ? topic.topicType.id : null,
        meshCoded: topic.meshCoded,
        meshCode: topic.meshCode,
        meshValue: topic.meshValue,
        meshQualcode: topic.meshQualcode,
        meshQualvalue: topic.meshQualvalue,
        originalValue: topic.originalValue,
        alreadyExist: true
      }))
    });
    return formArray;
  }
  updatePayload(payload) {
    if (!payload.objectId && this.objectId) {  // TODO test
      payload.objectId = this.objectId;
    }
    payload.meshCoded = payload.meshCoded === 'true' || payload.meshCoded === true ? true : false;
    if (payload.originalValue?.id) {
      payload.originalValue = payload.originalValue.id;
    }
  }
  addTopic(index) {
    this.spinner.show();
    const payload = this.form.value.objectTopics[index];
    delete payload.id;
    this.updatePayload(payload);

    this.objectService.addObjectTopic(this.objectId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 201) {
        this.toastr.success('Object Topic added successfully');
        this.getObjectTopic();
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
  editTopic(topicObject) {
    const payload = topicObject.value;
    this.updatePayload(payload);
    this.spinner.show();
    this.objectService.editObjectTopic(payload.id, payload.objectId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 200) {
        this.toastr.success('Object Topic updated successfully');
        this.getObjectTopic();
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
  findTopicType(id) {
    const topicTypeArrray: any = this.topicType.filter((type: any) => type.id === id);
    return topicTypeArrray && topicTypeArrray.length ? topicTypeArrray[0].name : '';
  }
  emitData() {
    const payload = this.form.value.objectTopics.map(item => {
      item.meshCoded = item.meshCoded === 'true' || item.meshCoded === true ? true : false;
      if (!item.id) {
        delete item.id;
      }
      if(this.objectId) {
        item.objectId = this.objectId;
      }
      return item;
    })
    this.emitTopic.emit({data: payload, isEmit: false});
  }
  compareCTs(ct1: TopicVocabularies, ct2: TopicVocabularies): boolean {
    return ct1?.id == ct2?.id;
  }
  customSearchCTs(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.firstName?.toLocaleLowerCase().indexOf(term) > -1;
  }
  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('objecttopic'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
