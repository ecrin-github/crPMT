import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { StudyRelationshipInterface } from 'src/app/_rms/interfaces/study/study-relationship.interface';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { StudyLookupService } from 'src/app/_rms/services/entities/study-lookup/study-lookup.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { Router } from '@angular/router';
import { StudyInterface } from 'src/app/_rms/interfaces/study/study.interface';

@Component({
  selector: 'app-study-relationship',
  templateUrl: './study-relationship.component.html',
  styleUrls: ['./study-relationship.component.scss']
})
export class StudyRelationshipComponent implements OnInit {
  form: UntypedFormGroup;
  relationshipType: [] = [];
  studies:[] = [];
  subscription: Subscription = new Subscription();
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  @Input() studyId: string;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Output() emitRelation: EventEmitter<any> = new EventEmitter();
  studyRelationship: StudyRelationshipInterface;
  len: any;
  isBrowsing: boolean = false;
  pageSize: Number = 10000;

  constructor( private fb: UntypedFormBuilder, private router: Router, private listService: ListService, private studyService: StudyService, private studyLookupService: StudyLookupService, private toastr: ToastrService, private spinner: NgxSpinnerService, private modalService: NgbModal) {
    this.form = this.fb.group({
      studyRelationships: this.fb.array([])
    });
   }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    this.getRelationshipType();
    this.getStudyList();
    if (this.isEdit || this.isView) {
      this.getStudyRelationship()
    }
  }
  studyRelationships(): UntypedFormArray {
    return this.form.get('studyRelationships') as UntypedFormArray;
  }

  newStudyRelation(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      studyId: '',
      relationshipType: null,
      targetStudy: '',
      alreadyExist: false
    });
  }

  addStudyRelation() {
    this.len = this.studyRelationships().value.length;
    if (this.len) {
      if (this.studyRelationships().value[this.len-1].relationshipType && this.studyRelationships().value[this.len-1].targetStudy) {
        this.studyRelationships().push(this.newStudyRelation());
      } else {
        if (this.studyRelationships().value[this.len-1].alreadyExist) {
          this.studyRelationships().push(this.newStudyRelation());
        } else {
          this.toastr.info('Please provide the Relationship Type and Target study in the previously added Study Relationship');
        }
      }
    } else {
      this.studyRelationships().push(this.newStudyRelation());
    }
  }

  removeStudyRelation(i: number) {
    if(!this.studyRelationships().value[i].alreadyExist) {
      this.studyRelationships().removeAt(i);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.type = 'studyRelationship';
      removeModal.componentInstance.id = this.studyRelationships().value[i].id;
      removeModal.componentInstance.studyId = this.studyRelationships().value[i].studyId;
      removeModal.result.then((data) => {
        if (data) {
          this.studyRelationships().removeAt(i);
        }
      }, error => {})
    }
  }
  getRelationshipType() {
    this.studyLookupService.getStudyRelationshipTypes(this.pageSize).subscribe((res: any) => {
      if(res.results) {
        this.relationshipType = res.results;
      }
    }, error => {
      this.toastr.error(error.error.title);
    });
  }
  getStudyList() {
    this.listService.getStudyList().subscribe((res: any) => {
      if (res && res.results) {
        this.studies = res.results.length ? res.results : [];
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  getStudyRelationship() {
    this.studyService.getStudyRelationships(this.studyId).subscribe((res: any) => {
      if (res && res.results) {
        this.studyRelationship = res.results.length ? res.results : [];
        this.patchForm(this.studyRelationship);
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  patchForm(relationships) {
    this.form.setControl('studyRelationships', this.patchArray(relationships));
  }
  patchArray(relationships): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    relationships.forEach(relationship => {
      formArray.push(this.fb.group({
        id: relationship.id,
        studyId: relationship.studyId,
        relationshipType: relationship.relationshipType ? relationship.relationshipType.id : null,
        targetStudy: relationship.targetStudy ? relationship.targetStudy : null,
        alreadyExist: true
      }))
    });
    return formArray;
  }
  updatePayload(payload) {
    if (!payload.studyId && this.studyId) {
      payload.studyId = this.studyId;
    }
    if (payload.targetStudy?.id) {
      payload.targetStudy = payload.targetStudy.id;
    }
  }
  addRelationship(index) {
    if (this.form.value.studyRelationships[index].targetStudy?.id === this.studyId) {
      this.toastr.error('Study can not be put in relationship to itself');
    } else {
      this.spinner.show();
      const payload = this.form.value.studyRelationships[index];
      this.updatePayload(payload);
      delete payload.id;

      this.studyService.addStudyRelationship(this.studyId, payload).subscribe((res: any) => {
        this.spinner.hide();
        if (res.statusCode === 201) {
          this.toastr.success('Study Relationship added successfully');
          this.getStudyRelationship();
        } else {
          this.toastr.error(res.messages[0]);
        }
      }, error => {
        this.spinner.hide();
        this.toastr.error(error.error.title);
      })
    }
  }
  editRelationship(relationObject) {
    if (relationObject.value.targetStudy?.id === this.studyId) {
      this.toastr.error('Study can not be put in relationship to itself');
    } else {
      const payload = relationObject.value;
      this.updatePayload(payload);
      this.spinner.show();  
      this.studyService.editStudyRelationship(payload.id, payload.studyId, payload).subscribe((res: any) => {
        this.spinner.hide();
        if (res.statusCode === 200) {
          this.toastr.success('Study Relationship updated successfully');
          this.getStudyRelationship();
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
  findRelationshipType(id) {
    const relationArray: any = this.relationshipType.filter((type: any) => type.id === id);
    return relationArray && relationArray.length ? relationArray[0].name : '';
  }
  findStudyTitle(id) {
    const studyArray: any = this.studies.filter((type: any) => type.studyId === id);
    return studyArray && studyArray.length ? studyArray[0].displayTitle : ''
  }
  emitData() {
    const payload = this.form.value.studyRelationships.map(item => {
      if (!item.id) {
        delete item.id;
      }
      if(this.studyId) {
        item.studyId = this.studyId;
      }
      return item;
    })
    this.emitRelation.emit({data: payload, isEmit: false});
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  compareStudies(s1: StudyInterface, s2: StudyInterface): boolean {
    return s1?.id == s2?.id;
  }
  customSearchStudies(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.id?.toLocaleLowerCase().indexOf(term) > -1 || item.displayTitle?.toLocaleLowerCase().indexOf(term) > -1;
  }
  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('relpanel'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }

}
