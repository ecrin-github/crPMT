import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { StudyTopicInterface } from 'src/app/_rms/interfaces/study/study-topic.interface';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { Router } from '@angular/router';
import { TopicVocabularies } from 'src/app/_rms/interfaces/context/topic-vocabularies/topic-vocabularies';

@Component({
  selector: 'app-study-topic',
  templateUrl: './study-topic.component.html',
  styleUrls: ['./study-topic.component.scss']
})
export class StudyTopicComponent implements OnInit {
  form: UntypedFormGroup;
  topicTypes: [] = [];
  subscription: Subscription = new Subscription();
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  @Input() studyId: string;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Output() emitTopic: EventEmitter<any> = new EventEmitter();
  studyTopic: StudyTopicInterface;
  controlledTerminology = [];
  len: any;
  isBrowsing: boolean = false;
  pageSize: Number = 10000;

  constructor( private fb: UntypedFormBuilder, private router: Router, private commonLookupService: CommonLookupService, private studyService: StudyService, private spinner: NgxSpinnerService, private toastr: ToastrService, private modalService: NgbModal) { 
    this.form = this.fb.group({
      studyTopics: this.fb.array([])
    })
  }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    this.getTopicType();
    this.getTopicVocabulary();
    if (this.isEdit || this.isView) {
      this.getStudyTopic();
    }
  }
  studyTopics(): UntypedFormArray {
    return this.form.get('studyTopics') as UntypedFormArray;
  }

  newStudyTopic(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      studyId: '',
      topicType: null,
      meshCoded: false,
      meshCode: '',
      meshValue: '',
      originalValue: null,
      alreadyExist: false
    });
  }

  addStudyTopic() {
    this.len = this.studyTopics().value.length;
    if (this.len) {
      if (this.studyTopics().value[this.len-1].topicType !== null && this.studyTopics().value[this.len-1].meshValue !== null) {
        this.studyTopics().push(this.newStudyTopic());
      } else {
        if (this.studyTopics().value[this.len-1].alreadyExist) {
          this.studyTopics().push(this.newStudyTopic());
        } else {
          this.toastr.info('Please provide the Topic Type and Topic Value in the previously added Study Topic');
        }
      }
    } else {
      this.studyTopics().push(this.newStudyTopic());
    }
  }

  removeStudyTopic(i: number) {
    if (!this.studyTopics().value[i].alreadyExist) {
      this.studyTopics().removeAt(i);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.type = 'studyTopic';
      removeModal.componentInstance.id = this.studyTopics().value[i].id;
      removeModal.componentInstance.studyId = this.studyTopics().value[i].studyId;
      removeModal.result.then((data) => {
        if (data) {
          this.studyTopics().removeAt(i);
        }
      }, error => {});
    }
  }
  getTopicType() {
    this.commonLookupService.getTopicTypes(this.pageSize).subscribe((res: any) => {
      if (res.results) {
        this.topicTypes = res.results;
      }
    }, error => {
      this.toastr.error(error.error.title);
    });
  }
  getTopicVocabulary() {
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
  getStudyTopic() {
    this.studyService.getStudyTopics(this.studyId).subscribe((res: any) => {
      if (res && res.results) {
        this.studyTopic = res.results.length ? res.results : [];
        this.patchForm(this.studyTopic);
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  patchForm(topics) {
    this.form.setControl('studyTopics', this.patchArray(topics));
  }
  patchArray(topics): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    topics.forEach(topic => {
      formArray.push(this.fb.group({
        id: topic.id,
        studyId: topic.studyId,
        topicType: topic.topicType ? topic.topicType.id : null,
        meshCoded: topic.meshCoded,
        meshCode: topic.meshCode,
        meshValue: topic.meshValue,
        originalValue: topic.originalValue,
        alreadyExist: true
      }))
    });
    return formArray;
  }
  updatePayload(payload) {
    if (!payload.studyId && this.studyId) {  // TODO test
      payload.studyId = this.studyId;
    }
    payload.meshCoded = payload.meshCoded === 'true' || payload.meshCoded === true ? true : false;
    if (payload.originalValue?.id) {
      payload.originalValue = payload.originalValue.id;
    }
  }
  addTopic(index) {
    const payload = this.form.value.studyTopics[index];
    this.spinner.show();
    if (payload.id) {
      delete payload.id;
    }
    this.updatePayload(payload);
    
    
    this.studyService.addStudyTopic(this.studyId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 201) {
        this.toastr.success('Study Topic added successfully');
        this.getStudyTopic();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    });
  }
  editTopic(topicObject) {
    const payload = topicObject.value;
    this.spinner.show();
    this.updatePayload(payload);
    this.studyService.editStudyTopic(payload.id, payload.studyId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 200) {
        this.toastr.success('Study Topic updated successfully');
        this.getStudyTopic();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }
  findTopicType(id) {
    const topicArray: any = this.topicTypes.filter((type: any) => type.id === id);
    return topicArray && topicArray.length ? topicArray[0].name : '';
  }
  compareCTs(ct1: TopicVocabularies, ct2: TopicVocabularies): boolean {
    return ct1?.id == ct2?.id;
  }
  customSearchCTs(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.firstName?.toLocaleLowerCase().indexOf(term) > -1;
  }
  emitData() {
    const payload = this.form.value.studyTopics.map(item => {
      if (!item.id) {
        delete item.id;
      }
      if(this.studyId) {
        item.studyId = this.studyId;
      }
      item.meshCoded = item.meshCoded === 'true' || item.meshCoded === true ? true : false;
      return item;
    })
    this.emitTopic.emit({data: payload, isEmit: false});
  }
  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('topicpanel'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
