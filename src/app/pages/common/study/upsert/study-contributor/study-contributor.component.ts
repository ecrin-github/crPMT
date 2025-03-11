import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { StudyContributorInterface } from 'src/app/_rms/interfaces/study/study-contributor.interface';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { Router } from '@angular/router';
import { OrganisationInterface } from 'src/app/_rms/interfaces/organisation/organisation.interface';
import { StudyContributorTypeInterface } from 'src/app/_rms/interfaces/study/study-contributor-type.interface';
import { StatesService } from 'src/app/_rms/services/states/states.service';

@Component({
  selector: 'app-study-contributor',
  templateUrl: './study-contributor.component.html',
  styleUrls: ['./study-contributor.component.scss']
})
export class StudyContributorComponent implements OnInit {
  form: UntypedFormGroup;
  contributorTypes: [] = [];
  organizationList: [] = [];
  subscription: Subscription = new Subscription();
  @Input() studyId: string;
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  studyContributor: StudyContributorInterface;
  isManager: boolean = false;
  isIndividual = [];
  notindividualArr: [] = [];
  individualArr: [] = [];
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Output() emitContributor: EventEmitter<any> = new EventEmitter();
  arrLength = 0;
  isBrowsing: boolean = false;
  pageSize: Number = 10000;

  constructor(
    private fb: UntypedFormBuilder, 
    private router: Router, 
    private commonLookupService: CommonLookupService, 
    private studyService: StudyService, 
    private spinner: NgxSpinnerService, 
    private toastr: ToastrService, 
    private modalService: NgbModal, 
    private statesService: StatesService) {
    this.form = this.fb.group({
      studyContributors: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    this.isManager = this.statesService.isManager();

    this.getContributorTypes();
    this.getOrganisation(this.statesService.currentAuthOrgId).subscribe((res: OrganisationInterface) => {
      this.setOrganisation(res);
    });

    // if (this.isEdit && this.isManager) {
    if (this.isEdit) {
      this.getOrganization();
    }

    if (this.isEdit || this.isView) {
      this.getStudyContributor();
    }
  }

  studyContributors(): UntypedFormArray {
    return this.form.get('studyContributors') as UntypedFormArray;
  }

  newStudyContributor(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      studyId: '',
      contributorType: null,
      isIndividual: false,
      organisation: null,
      person: '',
      alreadyExist: false
    });
  }

  checkIsIndividual(value) {
    return value === true || value === 'true';
  }

  addStudyContributor() {
    this.studyContributors().push(this.newStudyContributor());
  }

  removeStudyContributor(i: number) {
    if (!this.studyContributors().value[i].alreadyExist) {
      this.studyContributors().removeAt(i);
    } else {
      const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
      removeModal.componentInstance.type = 'studyContributor';
      removeModal.componentInstance.id = this.studyContributors().value[i].id;
      removeModal.componentInstance.studyId = this.studyContributors().value[i].studyId;
      removeModal.result.then((data) => {
        if (data) {
          this.studyContributors().removeAt(i);
        }
      }, error => {});
    }
  }

  getContributorTypes() {
    this.commonLookupService.getContributorTypes(this.pageSize).subscribe((res: any) => {
      if (res.results) {
        this.contributorTypes = res.results;
      }
    }, error => {
      console.log('error', error);
    });
  }

  getOrganization() {
    this.commonLookupService.getOrganizationList(this.pageSize).subscribe((res: any) => {
      if (res && res.results) {
        this.organizationList = res.results;
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }

  getStudyContributor() {
    this.studyService.getStudyContributors(this.studyId).subscribe((res: any) => {
      if (res && res.results) {
        this.studyContributor = res.results.length ? res.results : [];
        this.patchForm(this.studyContributor);
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }

  getOrganisation(orgId) {
    return this.commonLookupService.getOrganizationById(orgId);
  }

  setOrganisation(organisation: OrganisationInterface) {
    if (organisation) {
      this.form.patchValue({
        organisation: organisation,
      });
    }
  }

  patchForm(contributors) {
    this.form.setControl('studyContributors', this.patchArray(contributors));
  }

  patchArray(contributors): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    contributors.forEach(contributor => {
      formArray.push(this.fb.group({
        id: contributor.id,
        studyId: contributor.studyId,
        contributorType: contributor.contributorType,
        isIndividual: contributor.isIndividual,
        organisation: contributor.organisation,
        person: contributor.person,
        alreadyExist: true
      }))
    });
    if (this.isView) {
      this.individualArr = contributors.filter((item: any) => item.isIndividual === true);
      this.notindividualArr = contributors.filter((item: any) => item.isIndividual === false);
    }
    return formArray;
  }

  updatePayload(payload) {
    if (!payload.studyId && this.studyId) {
      payload.studyId = this.studyId;
    }
    if (payload.contributorType?.id) {
      payload.contributorType = payload.contributorType.id;
    }
    if (payload.organisation?.id) {
      payload.organisation = payload.organisation.id;
    }
  }

  addContributor(index) {
    this.spinner.show();
    const payload = JSON.parse(JSON.stringify(this.form.value.studyContributors[index]));
    if (payload.id) {
      delete payload.id;
    }
    this.updatePayload(payload);

    this.studyService.addStudyContributor(this.studyId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 201) {
        this.toastr.success('Study Contributor added successfully');
        this.getStudyContributor();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }

  editContributor(contributorStudy) {
    this.spinner.show();
    const payload = JSON.parse(JSON.stringify(contributorStudy.value));
    this.updatePayload(payload);
    
    this.studyService.editStudyContributor(payload.id, payload.studyId, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 200) {
        this.toastr.success('Study Contributor updated successfully');
        this.getStudyContributor();
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }

  emitData() {
    const payload = this.form.value.studyContributors.map(item => {
      item.isIndividual = this.checkIsIndividual(item.isIndividual);
      if (!item.id) {
        delete item.id;
      }
      if(this.studyId) {
        item.studyId = this.studyId;
      }
      return item;
    })
    this.emitContributor.emit({data: payload, isEmit: false});
  }

  onChange(index) {
    this.isIndividual[index] = this.checkIsIndividual(this.form.value.studyContributors[index].isIndividual);
    this.studyContributors().at(index).patchValue({
      contributorType: null,
      organisation: null,
      person: '',
    });
  }

  sameAsAbove() {
    const arr = this.studyContributors().value;
    const preValue = arr[arr.length - 2];
    this.studyContributors().at(this.arrLength).patchValue({
      isIndividual: preValue.isIndividual,
      organisation: preValue.organisation,
      contributorType: preValue.contributorType,
      person: preValue.person,
    })
  }

  compareOrganisations(o1: OrganisationInterface, o2: OrganisationInterface): boolean {
    return o1?.id == o2?.id;
  }

  customSearchOrganisations(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.defaultName.toLocaleLowerCase().indexOf(term) > -1;
  }

  compareTypes(s1: StudyContributorTypeInterface, s2: StudyContributorTypeInterface): boolean {
    return s1?.id == s2?.id;
  }

  customSearchTypes(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name.toLocaleLowerCase().indexOf(term) > -1;
  }

  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('conpanel' + this.studyContributors().value.length);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
