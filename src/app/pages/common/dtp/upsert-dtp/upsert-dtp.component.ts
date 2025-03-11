import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {  NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { DtpService } from 'src/app/_rms/services/entities/dtp/dtp.service';
import { ProcessLookupService } from 'src/app/_rms/services/entities/process-lookup/process-lookup.service';
import { CommonModalComponent } from '../../common-modal/common-modal.component';
import { ConfirmationWindow1Component } from '../../confirmation-window1/confirmation-window1.component';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { AddModalComponent } from '../../add-modal/add-modal.component';
import { PdfGeneratorService } from 'src/app/_rms/services/entities/pdf-generator/pdf-generator.service';
import { JsonGeneratorService } from 'src/app/_rms/services/entities/json-generator/json-generator.service';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { RedirectService } from './redirect-service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { catchError, finalize, map, mergeMap } from 'rxjs/operators';
import { UserInterface } from 'src/app/_rms/interfaces/user/user.interface';
import { dateToString, isWholeNumber, stringToDate } from 'src/assets/js/util';

@Component({
  selector: 'app-upsert-dtp',
  templateUrl: './upsert-dtp.component.html',
  styleUrls: ['./upsert-dtp.component.scss'],
  providers: [ScrollService],
})
export class UpsertDtpComponent implements OnInit {
  form: UntypedFormGroup;
  preReqForm: UntypedFormGroup;
  objectEmbargoForm: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  organizationList: [] = [];
  statusList = [];
  id: any;
  dtpData: any;
  sliceLength = 100;
  associatedStudies = [];
  associatedObjects = [];
  associatedUsers = [];
  todayDate: any;
  submitted: boolean = false;
  nextStep: number;
  buttonClick: any;
  showVariations: boolean = false;
  preRequTypes: [] = [];
  preRequisitData = [];
  accessTypes: [] = [];
  isEmbargoRequested = [];
  sticky: boolean = false;
  accessStatusTypes: [] = [];
  dtpArr: any;
  studyList: [] = [];
  objectList: [] = [];
  role: any;
  user: UserInterface;
  isManager: boolean = false;
  showUploadButton: boolean = false;
  addDOButtonDisabled: boolean = true;
  instanceArray = [];
  pageSize: number = 10000;
  dtaData: any;
  prereqs: any;
  dtpNotes: any;
  stepperFields = {
    1: ["setUpStartDate", "setUpCompleteDate"],
    2: ["mdCompleteDate", "dtaAgreedDate"],
    3: ["qcChecksCompleteDate"],
    4: ["uploadCompleteDate"]
  }
  currentStep: number = 1;
  maxSteps: number = 4;
  lastCompletedStep: number = -1;
  storedDatesError = {1: [], 2: [], 3: [], 4: []};

  constructor(private statesService: StatesService,
              private backService: BackService,
              private scrollService: ScrollService,
              private router: Router, 
              private fb: UntypedFormBuilder, 
              private dtpService: DtpService, 
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService,
              private activatedRoute: ActivatedRoute, 
              private modalService: NgbModal, 
              private commonLookup: CommonLookupService, 
              private processLookup: ProcessLookupService,
              private reuseService: ReuseService,
              private listService: ListService, 
              private pdfGeneratorService: PdfGeneratorService, 
              private jsonGenerator: JsonGeneratorService,
              private dataObjectService: DataObjectService, 
              private oidcSecurityService: OidcSecurityService, 
              private redirectService: RedirectService) {
    this.form = this.fb.group({
      organisation: ['', Validators.required],
      displayName: ['', Validators.required],
      status: '',
      setUpStartDate: null,
      setUpCompleteDate: null,
      mdCompleteDate: null,
      dtaAgreedDate: null,
      qcChecksCompleteDate: null,
      uploadCompleteDate: null,
      conformsToDefault: false,
      variations: '',
      dtaFilePath: '',
      repoSignature1: '',
      repoSignature2: '',
      providerSignature1: '',
      providerSignature2: '',
      notes: this.fb.array([])
    });
    this.preReqForm = this.fb.group({
      preRequisite: this.fb.array([])
    });
    this.objectEmbargoForm = this.fb.group({
      embargo: this.fb.array([])
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.spinner.show(); 
    });

    const todayDate = new Date();
    this.todayDate = {year: todayDate.getFullYear(), month: todayDate.getMonth()+1, day: todayDate.getDate()};
    this.isManager = this.statesService.isManager();
    this.role = this.statesService.currentAuthRole;
    this.user = this.statesService.currentUser;
    this.isEdit = this.router.url.includes('edit') ? true : false;
    this.isView = this.router.url.includes('view') ? true : false;
    this.id = this.activatedRoute.snapshot.params.id;

    this.scrollService.handleScroll([`/data-transfers/${this.id}/view`, `/data-transfers/${this.id}/edit`, `/data-transfers/add`]);

    if (this.router.url.includes('add')) {
      this.form.patchValue({
        setUpStartDate: this.todayDate
      })
    }
    
    let queryFuncs: Array<Observable<any>> = [];

    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries
    if (this.isEdit || this.isView) {
      // TODO: could be improved (less calls) if the API for getDtpById returned more linked items (e.g. notes)
      queryFuncs.push(this.getDtpObjectsAndInstances(this.id));
      queryFuncs.push(this.getDtpObjectPrereqs(this.id));
      queryFuncs.push(this.getDtpStudies(this.id));
      queryFuncs.push(this.getDtpPeople(this.id));
      queryFuncs.push(this.getDtpNotes(this.id));
      queryFuncs.push(this.getDta(this.id));
      queryFuncs.push(this.getDtpById(this.id));
    }

    // TODO: improve speed by removing calls not needed if isView
    queryFuncs.push(this.getOrganisation());
    queryFuncs.push(this.getStatus());
    queryFuncs.push(this.getStudyList());
    queryFuncs.push(this.getObjectList());
    queryFuncs.push(this.getAccessTypes());
    queryFuncs.push(this.getAccessStatusTypes());
    queryFuncs.push(this.getPrereqTypes());

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error.error.title)))));
    });

    combineLatest(obsArr).subscribe(res => {
      this.setPrereqTypes(res.pop());
      this.setAccessStatusTypes(res.pop());
      this.setAccessTypes(res.pop());
      this.setObjectList(res.pop());
      this.setStudyList(res.pop());
      this.setStatus(res.pop());
      this.setOrganisation(res.pop());

      if (this.isEdit || this.isView) {
        this.setDtpById(res.pop());
        this.setDta(res.pop());
        this.setDtpNotes(res.pop());
        this.setDtpPeople(res.pop());
        this.setDtpStudies(res.pop());
        this.setDtpObjectPrereqs(res.pop());
        // getDtpObjectsAndInstances doesn't return a value
      }

      this.verifyStep();

      setTimeout(() => {
        this.spinner.hide(); 
      });
    });
  }

  changeStep(forward) {
    if (forward) {
      if (this.isView || (!(this.currentStep === this.maxSteps) && (this.currentStep <= this.lastCompletedStep))) {
        if (this.storedDatesError[this.currentStep].length > 0) {
          for (let errMessage of this.storedDatesError[this.currentStep]) {
            this.toastr.error(errMessage, `Error on step ${this.currentStep}`);
          }
        } else {
          this.currentStep += 1;
          this.updateIcons();
        }
      } else {
        this.toastr.error('Complete all the fields to go to the next step');
      }
    } else if (!(this.currentStep === 1)) {
      this.currentStep -= 1;
      this.updateIcons();
    } else {
      this.toastr.error('Something went wrong, please refresh the page');
    }
  }

  verifyStep() {
    this.storedDatesError = {1: [], 2: [], 3: [], 4: []};;
    let lastDateField = '';
    let isValid: boolean = true;
    let notValidInd = this.maxSteps + 1;

    for (let i = 1; i <= this.maxSteps; i++) {
      for (const field of this.stepperFields[i]) {
        if (!isValid) {
          this.g[field].setValue(null);
        } else if (!(this.form.value[field])) {
          isValid = false;
          notValidInd = i;
          break;
        }

        if (lastDateField) {  // Note: if this.form.value[field] is not set, loop will break before (hence no checking here)
          this.verifyDates(lastDateField, field, i);
        }
        lastDateField = field;
      }
    }

    // Note: "notValidInd" will be this.maxSteps+1 if isValid
    this.lastCompletedStep = notValidInd - 1;

    this.updateIcons();
    this.updateStatus();
  }

  verifyDates(lastDateField, currDateField, step) {
    if (this.dateToString(this.form.value[lastDateField]) > this.dateToString(this.form.value[currDateField])) {
      let errorMessage = '';

      if (currDateField === 'setUpCompleteDate') {
        errorMessage = 'Setup completed date cannot be earlier than Setup started date.';
      } else if (currDateField === 'mdCompleteDate') {
        errorMessage = 'Metadata completed date cannot be earlier than Setup completed date';
      } else if (currDateField === 'dtaAgreedDate') {
        errorMessage = 'Data Transfer Agreement date cannot be earlier than Metadata completed date';
      } else if (currDateField === 'qcChecksCompleteDate') {
        errorMessage = 'Quality checks completed date cannot be earlier than Data Transfer Agreement date';
      } else if (currDateField === 'uploadCompleteDate') {
        errorMessage = 'Upload complete date cannot be earlier than Quality checks completed date';
      }

      this.storedDatesError[step].push(errorMessage);
    }
  }

  updateIcons() {
    const stepElements = document.querySelectorAll('.stepper-step');
    stepElements.forEach((stepElement, stepNumber) => {
      stepElement.setAttribute('data-stepper-state', stepNumber+1 <= this.currentStep ? 'activated' : '');
    })
  }

  updateStatus() {
    if (this.lastCompletedStep >= 0) {
      if (this.lastCompletedStep === this.maxSteps) {
        this.g['status'].setValue(this.statusList[this.lastCompletedStep-1]);
      } else {
        this.g['status'].setValue(this.statusList[this.lastCompletedStep]);
      }
    }
  }

  notes(): UntypedFormArray {
   return this.form.get('notes') as UntypedFormArray;
  }

  newDtpNote(): UntypedFormGroup {
    return this.fb.group({
      dtpId: '',
      text: '',
      alreadyExist: false,
      author: this.statesService.currentUser,
    })
  }

  addDtpNote() {
    this.notes().push(this.newDtpNote());
  }

  patchNotes(notes) {
    this.form.setControl('notes', this.patchNoteArray(notes));
  }

  patchNoteArray(notes): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    notes.forEach(note => {
      formArray.push(this.fb.group({
        id: note.id,
        dtpId: note.dtpId,
        text: note.text,
        alreadyExist: true,
        author: note.author
      }))
    });
    return formArray;
  }
  
  deleteDtpNote(i) {
    if (this.notes().value[i].alreadyExist) {
      this.spinner.show();
      this.dtpService.deleteDtpNote(this.notes().value[i].id, this.id).subscribe((res: any) => {
        this.toastr.success('Note deleted successfully');
        this.getDtpNotes(this.id).subscribe((res) => {
          this.setDtpNotes(res);
          this.spinner.hide();
        });
      }, error => {
        this.spinner.hide();
        this.toastr.error(error.error.title);
      })
    } else {
      this.notes().removeAt(i);
    }
  }

  saveDtpNote(note) {
    const payload = {
      'id': note.value.id,
      'author': note.value.author?.id ? note.value.author.id : note.value.author,
      'text': note.value.text,
      'createdOn': note.value.createdOn,
      'dtpId': note.value.dtpId,
    };
    if (note.value.alreadyExist) {
      this.spinner.show();
      this.dtpService.editDtpNote(payload.id, this.id, payload).subscribe((res: any) => {
        this.spinner.hide();
        if (res.statusCode === 200) {
          this.toastr.success('Note updated successfully');
        } else {
          this.toastr.error(res.messages[0])
        }
      }, error => {
        this.spinner.hide();
        this.toastr.error(error.error.title);
      })
    } else {
      this.spinner.show();
      payload.dtpId = this.id;
      this.dtpService.addDtpNote(this.id, payload).subscribe((res: any) => {
        note.value.alreadyExist = true;
        this.spinner.hide();
        if (res.statusCode === 201) {
          note.value.id = res?.id;
          note.value.dtpId = res?.dtpId;
          this.toastr.success('Note added successfully');
        } else {
          this.toastr.error(res.messages[0]);
        }
      }, error => {
        this.spinner.hide();
        this.toastr.error(error.error.title);
      })
    }
  }

  preReqs(): UntypedFormArray {
    return this.preReqForm.get('preRequisite') as UntypedFormArray
  }

  newPreReq(): UntypedFormGroup {
    return this.fb.group({
      id: '',
      prereqNotes: '',
      prereqType: '',
      dataObject: ''
    })
  }
 
  addPreReq() {
    const addModal = this.modalService.open(AddModalComponent, { size: 'lg', backdrop: 'static'});
    addModal.componentInstance.title = 'Add Pre-Requisite';
    addModal.componentInstance.dtpId = this.id;
    addModal.componentInstance.type = 'dtpPrereq';
    addModal.result.then((data) => {
      if (data) {
        this.getDtpObjectPrereqs(this.id).subscribe((res) => this.setDtpObjectPrereqs(res));
      }
    }, error => {})
  }

  patchPreReq(preReqs) {
    this.preReqForm.setControl('preRequisite', this.patchPreReqArray(preReqs));
  }

  patchPreReqArray(preReqs): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    preReqs.forEach(preReq => {
      formArray.push(this.fb.group({
        id: preReq.id,
        prereqNotes: preReq.prereqNotes,
        prereqType: preReq.prereqType ? preReq.prereqType.id : null,
        dtpDataObject: preReq.dtpDataObject
      }))
    });
    return formArray;
  }

  editPreReq(preReqsObject) {
    const payload = JSON.parse(JSON.stringify(preReqsObject.value));  // Deep copy to keep whole data object to display sdOid
    if (payload.dtpDataObject?.id) {
      payload.dtpDataObject = payload.dtpDataObject?.id;
    }
    this.spinner.show();
    this.dtpService.editDtpObjectPrereq(payload.id, this.id, payload).subscribe((res: any) => {
      this.spinner.hide();
      if (res.statusCode === 200) {
        this.toastr.success('Pre-Requisite updated successfully');
      } else {
        this.toastr.error(res.messages[0]);
      }
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }

  removePreReq(i) {
    const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
    removeModal.componentInstance.type = 'objectPreReqDtp';
    removeModal.componentInstance.id = this.preReqs().value[i].id;
    removeModal.componentInstance.objectId = this.preReqs().value[i].objectId;
    removeModal.componentInstance.dtpId = this.id;
    removeModal.result.then((data) => {
      this.spinner.show();
      if (data) {
        this.getDtpObjectPrereqs(this.id).subscribe((res) => {
          this.setDtpObjectPrereqs(res);
          this.spinner.hide();
        });
      }
    }, error => {})
  }

  get g() { return this.form.controls; }

  getOrganisation() {
    return this.commonLookup.getOrganizationList(this.pageSize);
  }

  setOrganisation(res) {
    if (res && res.results) {
      this.organizationList = res.results;
    }
  }

  getStatus() {
    return this.processLookup.getDtpStatusTypes();
  }

  setStatus(res) {
    if (res?.results) {
      this.statusList = res.results;

      this.statusList.sort((a: any, b: any) => { 
        return a?.listOrder > b?.listOrder ? 1 : -1; 
      });

      if (this.statusList.length > 0) {
        this.g['status'].setValue(this.statusList[0]);
      }
    }
  }

  getStudyList() {
    return this.listService.getStudyList();
  }

  setStudyList(res) {
    if (res && res.data) {
      this.studyList = res.data;
    }
  }

  getObjectList() {
    return this.listService.getObjectList();
  }

  setObjectList(res) {
    if (res && res.data) {
      this.objectList = res.data;
    }
  }

  getDtpStudies(id) {
    return this.dtpService.getDtpStudies(id);
  }

  getSortedDtpStudies(studies) {
    const { compare } = Intl.Collator('en-GB');
    studies.sort((a, b) => {
      if (a.study?.sdSid.length > 5 && b.study?.sdSid.length > 5) {
        if (isWholeNumber(a.study?.sdSid.slice(5, ))) {
          if (isWholeNumber(b.study?.sdSid.slice(5, ))) {
            // Both a and b are int
            return parseInt(a.study?.sdSid.slice(5, )) > parseInt(b.study?.sdSid.slice(5, )) ? 1 : -1;
          }
        } else {
          if (isWholeNumber(b.study?.sdSid.slice(5, ))) {
            // a is not int, b is int
            return 1;
          } else {
            // Both a and b are not int
            return compare(a.study?.sdSid, b.study?.sdsdSidOid);
          }
        }
      }
      return -1;
    });
  }

  setDtpStudies(res) {
    if (res) {
      this.getSortedDtpStudies(res.results);
      this.associatedStudies = res.results;
      if (this.associatedStudies.length > 0) {
        this.addDOButtonDisabled = false;
      }
    }
  }

  getSortedDtpObjects(objects) {
    const { compare } = Intl.Collator('en-GB');
    objects.sort((a, b) => {
      if (a.dataObject?.sdOid.length > 5 && b.dataObject?.sdOid.length > 5) {
        if (isWholeNumber(a.dataObject?.sdOid.slice(5, ))) {
          if (isWholeNumber(b.dataObject?.sdOid.slice(5, ))) {
            // Both a and b are int
            return parseInt(a.dataObject?.sdOid.slice(5, )) > parseInt(b.dataObject?.sdOid.slice(5, )) ? 1 : -1;
          }
        } else {
          if (isWholeNumber(b.dataObject?.sdOid.slice(5, ))) {
            // a is not int, b is int
            return 1;
          } else {
            // Both a and b are not int
            return compare(a.dataObject?.sdOid, b.dataObject?.sdOid);
          }
        }
      }
      return -1;
    });
  }

  getDtpObjectsAndInstances(id) {
    return this.dtpService.getDtpObjects(id).pipe(
      map((res: any) => {
        if (res) {
          this.getSortedDtpObjects(res.results);
          this.associatedObjects = res.results;
          // TODO improve with API for a single call
          // TODO: useless? associatedObjects contains instances already
          this.associatedObjects.map((item, index) => {
            this.dataObjectService.getObjectInstances(item.dataObject?.id, this.pageSize).subscribe((res:any) => {
              res.results.forEach(inst => inst.sdOid = item.dataObject?.sdOid);
              this.instanceArray[index] = res.results;
            }, error => {
              this.toastr.error(error.error.title);
            });
          })
        }
      })
    );
  }

  getDtpObjectPrereqs(id) {
    return this.dtpService.getDtpObjectPrereqs(id);
  }

  getSortedPrereqs(prereqs) {
    const { compare } = Intl.Collator('en-GB');
    prereqs.sort((a, b) => {
      if (a.dtpDataObject.dataObject?.sdOid === b.dtpDataObject.dataObject?.sdOid) {
        return compare(a.prereqType?.name, b.prereqType?.name);
      } else {
        return a.dtpDataObject.dataObject?.sdOid > b.dtpDataObject.dataObject?.sdOid ? 1 : -1;
      }
    });
  }

  setDtpObjectPrereqs(res) {
    if (res && res.results) {
      this.getSortedPrereqs(res.results);
      this.prereqs = res.results;
      this.patchPreReq(this.prereqs);
    }
  }

  getAccessTypes() {
    return this.processLookup.getRepoAccessTypes(this.pageSize);
  }

  setAccessTypes(res) {
    if (res && res.results) {
      this.accessTypes = res.results;
    }
  }

  getAccessStatusTypes() {
    return this.processLookup.getObjectAccessTypes(this.pageSize);
  }

  setAccessStatusTypes(res) {
    if (res) {
      this.accessStatusTypes = res.results;
    }
  }

  getDtpPeople(id) {
    return this.dtpService.getDtpPeople(id);
  }

  getSortedDtpPeople(people) {
    const { compare } = Intl.Collator('en-GB');
    people.sort((a, b) => {
      return compare(a.person?.lastName, b.person?.lastName);
    });
  }

  setDtpPeople(res) {
    if (res) {
      this.getSortedDtpPeople(res.results);
      this.associatedUsers = res.results;
    }
  }

  getPrereqTypes() {
    return this.processLookup.getPrereqTypes(this.pageSize);
  }

  setPrereqTypes(res) {
    if (res) {
      this.preRequTypes = res.results;
    }
  }

  getDtpNotes(id) {
    return this.dtpService.getDtpNotes(id);
  }

  setDtpNotes(res) {
    if (res && res.results) {
      this.patchNotes(res.results);
      this.dtpNotes = res.results;
    }
  }

  getDta(id) {
    return this.dtpService.getDta(id);
  }

  setDta(res) {
    if (res && res.results) {
      this.dtaData = res.results;
      this.patchDta(this.dtaData);
    }
  }

  getDtpById(id) {
    return this.dtpService.getDtpById(id);
  }

  setDtpById(res) {
    if (res) {
      this.dtpData = res;
      this.patchForm(this.dtpData);
    }
  }
  
  findPrereqType(id) {
    const arr: any = this.preRequTypes.filter((item: any) => item.id === id);
    return arr && arr.length ? arr[0].name : 'None';
  }

  findAccessType(id) {
    const arr: any = this.accessTypes.filter((item: any) => item.id === id);
    return arr && arr.length ? arr[0].name : 'None';
  }

  findCheckSatus(id) {
    const arr: any = this.accessStatusTypes.filter((item: any) => item.id === id);
    return arr && arr.length ? arr[0].name : 'None';
  }

  dateToString(date) {
    return dateToString(date);
  }

  stringToDate(date) {
    return stringToDate(date);
  }

  viewDate(date) {
    const dateArray = new Date(date);
    return date ? dateArray.getFullYear() + '/' 
        + (dateArray.getMonth()+1).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + '/' 
        + (dateArray.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) : '';
  }

  onSave() {
    // Setting local storage to reload the dashboard page when adding or editing the dtp
    if (localStorage.getItem('updateDtpList')) {
      localStorage.removeItem('updateDtpList');
    }
    const payload = JSON.parse(JSON.stringify(this.form.value));
    payload.setUpStartDate = this.dateToString(payload.setUpStartDate);
    payload.setUpCompleteDate = this.dateToString(payload.setUpCompleteDate);
    payload.mdCompleteDate = this.dateToString(payload.mdCompleteDate);
    payload.dtaAgreedDate = this.dateToString(payload.dtaAgreedDate);
    payload.qcChecksCompleteDate = this.dateToString(payload.qcChecksCompleteDate);
    payload.uploadAccessRequestedDate = this.dateToString(payload.uploadAccessRequestedDate);
    payload.uploadAccessConfirmedDate = this.dateToString(payload.uploadAccessConfirmedDate);
    payload.uploadCompleteDate = this.dateToString(payload.uploadCompleteDate);

    if (payload.repoSignature1?.id) {
      payload.repoSignature1 = payload.repoSignature1.id;
    }
    if (payload.repoSignature2?.id) {
      payload.repoSignature2 = payload.repoSignature2.id;
    }
    if (payload.providerSignature1?.id) {
      payload.providerSignature1 = payload.providerSignature1.id;
    }
    if (payload.providerSignature2?.id) {
      payload.providerSignature2 = payload.providerSignature2.id;
    }
    if (payload.status?.id) {
      payload.status = payload.status.id;
    }

    let hasErrors: boolean = false;
    for (const [step, errors] of Object.entries(this.storedDatesError)) {
      for (let errMessage of errors) {
        if (!hasErrors) {
          hasErrors = true;
        }
        this.toastr.error(errMessage, `Error on step ${step}`);
      }
    }

    if (!hasErrors) {
      this.submitted = true;
      if (this.form.valid) {
        if (this.isEdit) {
          this.spinner.show();
          payload.dtpId = this.id;
          const editCoreDtp$ = this.dtpService.editDtp(this.id, payload);
          const editDta$ = this.dtaData?.length ? this.dtpService.editDta(this.id, payload, this.dtaData[0].id) : this.dtpService.addDta(this.id, payload);
          delete payload.notes;
          const combine$ = combineLatest([editCoreDtp$, editDta$]).subscribe(([coreDtpRes, dtaRes] : [any, any]) => {
            let success: boolean = true;
            if (!(coreDtpRes.statusCode === 200 || coreDtpRes.statusCode === 201)) {
              success = false;
              this.toastr.error(coreDtpRes.messages[0]);
            }
            if (!(dtaRes.statusCode === 200 || dtaRes.statusCode === 201)) {
              success = false;
              this.toastr.error(dtaRes.messages[0]);
            }
            this.spinner.hide();
            if (success) {
              this.toastr.success('DTP updated successfully');
              localStorage.setItem('updateDtpList', 'true');
              this.reuseService.notifyComponents();
              this.router.navigate([`/data-transfers/${this.id}/view`]);
            }
          }, error => {
            this.spinner.hide();
            this.toastr.error(error.error.title);
          })
        } else {
          this.spinner.show();
          this.dtpService.addDtp(payload).subscribe((res: any) => {
            if (res.statusCode === 201) {
              this.toastr.success('DTP added successfully.');
              localStorage.setItem('updateDtpList', 'true');
              this.reuseService.notifyComponents();
              if (res.id) {
                this.router.navigate([`/data-transfers/${res.id}/view`]);
              } else {
                this.back();
              }
            } else {
              this.spinner.hide();
              this.toastr.error(res.messages[0]);
            }
          }, error => {
            this.spinner.hide();
            this.toastr.error(error.error.title);
          })
        }
      } else {
        this.toastr.error("Please correct the errors in the form's fields.");
      }
    }
  }

  getStatusByName(name) {
    const arr: any = this.statusList.filter((item: any) => item.name.toLowerCase() === name);
    return arr[0].id;
  }

  patchForm(data) {
    this.form.patchValue({
      organisation: data.organisation ? data.organisation.id : null,
      displayName: data.displayName,
      status: data.status,
      setUpStartDate: this.stringToDate(data.setUpStartDate),
      setUpCompleteDate: this.stringToDate(data.setUpCompleteDate),
      mdCompleteDate: this.stringToDate(data.mdCompleteDate),
      dtaAgreedDate: this.stringToDate(data.dtaAgreedDate),
      qcChecksCompleteDate: this.stringToDate(data.qcChecksCompleteDate),
      uploadCompleteDate: this.stringToDate(data.uploadCompleteDate),
    });

    let found: boolean = false;
    let i = this.maxSteps;

    // Note: i >= 1 instead of i > i is wrong here
    while (!found && i > 1) {
      for (let field of this.stepperFields[i]) {
        if (this.dtpData[field]) {
          this.currentStep = i;
          found = true;
          break;
        }
      }
      if (!found) {
        i--;
      }
    }

    this.currentStep = i;
  }

  patchDta(dtaData) {
    this.form.patchValue({
      conformsToDefault: dtaData[0]?.conformsToDefault,
      variations: dtaData[0]?.variations,
      dtaFilePath: dtaData[0]?.dtaFilePath,
      repoSignature1: dtaData[0]?.repoSignature1,
      repoSignature2: dtaData[0]?.repoSignature2,
      providerSignature1: dtaData[0]?.providerSignature1,
      providerSignature2: dtaData[0]?.providerSignature2
    });
    this.showVariations = dtaData[0]?.conformsToDefault ? true : false;
  }

  findOrganization(id) {
    const organizationArray: any = this.organizationList.filter((type: any) => type.id === id);
    return organizationArray && organizationArray.length ? organizationArray[0].defaultName : ''
  }

  findStatus(id) {
    const statusArray: any = this.statusList.filter((type: any) => type.id === id);
    return statusArray && statusArray.length ? statusArray[0].name : '';
  }

  back(): void {
    this.backService.back();
  }

  addStudy() {
    const studyModal = this.modalService.open(CommonModalComponent, { size: 'xl', backdrop: 'static' });
    studyModal.componentInstance.title = 'Add Studies and Data Objects';
    studyModal.componentInstance.type = 'study';
    studyModal.componentInstance.dtpId = this.id;
    studyModal.componentInstance.currentStudiesIds = new Set(this.associatedStudies.map((item) => item.study?.id));
    studyModal.componentInstance.currentObjectsIds = new Set(this.associatedObjects.map((item) => item.dataObject?.id));
    studyModal.result.then((data) => {
      if (data) {
        this.spinner.show();
        setTimeout(() => {
          combineLatest([
            this.getDtpObjectsAndInstances(this.id),
            this.getDtpStudies(this.id),
          ]).subscribe((res) => {
            this.setDtpStudies(res.pop());
            // getDtpObjectsAndInstances doesn't return a value
            this.spinner.hide();
          });
        });
      }
    }, error => {})
  }

  removeDtpStudy(dtpStudy) {
    this.spinner.show();
    this.commonLookup.objectInvolvementDtp(this.id, dtpStudy.study?.id).subscribe((res: any) => {
      if (res.studyAssociated && res.objectsAssociated) {
        this.toastr.error(`Object(s) linked to this study are linked to this DTP. Remove the object(s) before removing this study.`);
        this.spinner.hide();
      } else {
        this.dtpService.deleteDtpStudy(dtpStudy.id, this.id).subscribe((res: any) => {
          this.toastr.success('Study has been disassociated successfully.');
          this.getDtpStudies(this.id).subscribe((res) => {
            this.setDtpStudies(res)
            this.spinner.hide();
          });
        }, error => {
          this.toastr.error(error.error.title);
          this.spinner.hide();
        })
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }

  addDataObject() {
    const dataModal = this.modalService.open(CommonModalComponent, {size: 'xl', backdrop: 'static'});
    dataModal.componentInstance.title = 'Add Data Objects';
    dataModal.componentInstance.type = 'dataObject';
    dataModal.componentInstance.dtpId = this.id;
    dataModal.componentInstance.currentStudiesIds = new Set(this.associatedStudies.map((item) => item.study?.id));
    dataModal.componentInstance.currentObjectsIds = new Set(this.associatedObjects.map((item) => item.dataObject?.id));
    dataModal.result.then((data) => {
      if (data) {
        this.spinner.show();
        setTimeout(() => {
          this.getDtpObjectsAndInstances(this.id).subscribe(() => {
            this.spinner.hide();
          });
        });
      }
    }, error => {});
  }
  
  removeDtpObject(id) {
    this.spinner.show();
    this.dtpService.deleteDtpObject(id, this.id).subscribe((res: any) => {
      this.getDtpObjectsAndInstances(this.id).subscribe(() => {
        this.toastr.success('Data object has been disassociated successfully');
        this.spinner.hide();
      });
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }

  addUser() {
    const userModal = this.modalService.open(CommonModalComponent, {size: 'xl', backdrop: 'static'});
    userModal.componentInstance.title = 'Add Users';
    userModal.componentInstance.type = 'user';
    userModal.componentInstance.dtpId = this.id;
    userModal.componentInstance.currentUsersIds = new Set(this.associatedUsers.map((item) => item.person?.id));

    userModal.result.then((data) => {
      if (data) {
        this.spinner.show();
        setTimeout(() => this.getDtpPeople(this.id).subscribe((res) => {
          this.setDtpPeople(res);
          this.spinner.hide();
        }));
      }
    }, error => {});
  }

  findPeopleById(id) {
    const arr: any = this.associatedUsers.filter((item: any) => item.id === id);
    return arr && arr.length ? arr[0].person?.firstName + ' ' + arr[0].person?.lastName : 'None';
  }

  removeDtpUser(id) {
    this.spinner.show();
    this.dtpService.deleteDtpPerson(id, this.id).pipe(
      mergeMap(() => {
        return this.getDtpPeople(this.id);
      }),
      mergeMap((res) => {
        this.setDtpPeople(res);
        return this.getDta(this.id);
      }),
      mergeMap((res) => {
        this.setDta(res);
        return this.getDtpObjectsAndInstances(this.id);
      }),
      map(() => {
        // getDtpObjectsAndInstances does not return a value
        this.toastr.success('User has been dissociated successfully');
      }),
      finalize(() => this.spinner.hide()),
      catchError(err => {
        this.toastr.error(err.message, 'Error during user dissociation');
        return of(false);
      })
    ).subscribe();
  }

  printDocument() {
    const payload = JSON.parse(JSON.stringify(this.dtpData));
    payload.associatedStudies = this.associatedStudies;
    payload.associatedObjects = this.associatedObjects;
    payload.associatedUsers = this.associatedUsers;
    payload.prereqs = this.prereqs;
    this.pdfGeneratorService.dtpPdfGenerator(payload);
  }

  cleanJSON(obj) {
    const keysToDel = ['lastEditedBy', 'deidentType', 'deidentDirect', 'deidentHipaa', 'deidentDates', 'deidentKanon', 'deidentNonarr', 'deidentDetails'];
    for (let key in obj) {
      if (keysToDel.includes(key)) {
        delete obj[key];
      } else if (key === 'person' && obj[key] !== null) { // Removing most user info
        obj[key] = {'userProfile': obj['person']['userProfile'], 
                    'firstName': obj['person']['firstName'],
                    'lastName': obj['person']['lastName'],
                    'email': obj['person']['email']};
      } else if (key === 'id') {  // Deleting all internal IDs
        delete obj[key];
      } else {
        if (typeof obj[key] === 'object') {
          if (Array.isArray(obj[key])) {
            // loop through array
            for (let i = 0; i < obj[key].length; i++) {
              this.cleanJSON(obj[key][i]);
            }
          } else {
            // call function recursively for object
            this.cleanJSON(obj[key]);
          }
        }
      }
    }
  }

  jsonExport() {
    const payload = JSON.parse(JSON.stringify(this.dtpData));
    /*payload.coreDtp.organisation = this.findOrganization(payload.coreDtp.organisation);
    payload.coreDtp.status = this.findStatus(payload.coreDtp.status);
    payload.coreDtp.initialContactDate = this.viewDate(payload.coreDtp.initialContactDate);
    payload.coreDtp.setUpCompleteDate = this.viewDate(payload.coreDtp.setUpCompleteDate);
    payload.coreDtp.mdAccessGrantedDate = this.viewDate(payload.coreDtp.mdAccessGrantedDate);
    payload.coreDtp.mdCompleteDate = this.viewDate(payload.coreDtp.mdCompleteDate);
    payload.coreDtp.dtaAgreedDate = this.viewDate(payload.coreDtp.dtaAgreedDate);
    payload.coreDtp.uploadAccessRequestedDate = this.viewDate(payload.coreDtp.uploadAccessRequestedDate);
    payload.coreDtp.uploadAccessConfirmedDate = this.viewDate(payload.coreDtp.uploadAccessConfirmedDate);
    payload.coreDtp.uploadCompleteDate = this.viewDate(payload.coreDtp.uploadCompleteDate);
    payload.coreDtp.qcChecksCompleteDate = this.viewDate(payload.coreDtp.qcChecksCompleteDate);
    payload.coreDtp.mdIntegratedWithMdrDate = this.viewDate(payload.coreDtp.mdIntegratedWithMdrDate);
    payload.coreDtp.availabilityRequestedDate = this.viewDate(payload.coreDtp.availabilityRequestedDate);
    payload.coreDtp.availabilityConfirmedDate = this.viewDate(payload.coreDtp.availabilityConfirmedDate);
    payload.dtas[0].repoSignature1 = this.findPeopleById(payload.dtas[0].repoSignature1);
    payload.dtas[0].repoSignature2 = this.findPeopleById(payload.dtas[0].repoSignature2);
    payload.dtas[0].providerSignature1 = this.findPeopleById(payload.dtas[0].providerSignature1);
    payload.dtas[0].providerSignature2 = this.findPeopleById(payload.dtas[0].providerSignature2);
    payload.dtpNotes.map(item => {
      item.author = this.findPeopleById(item.author);
      item.createdOn = this.viewDate(item.createdOn);
    })
    payload.dtpStudies.map(item => {
      item.studyName = this.findStudyById(item.sdSid);
    })
    payload.dtpObjects.map(item => {
      item.objectName  =  this.findObjectById(item.objectId);
      item.accessType = this.findAccessType(payload.accessType);
      item.accessCheckStatus = this.findCheckSatus(item.accessCheckStatus);
      item.accessCheckBy = this.findPeopleById(item.accessCheckBy);
    });*/
    this.jsonGenerator.jsonGenerator(payload, 'dtp');
  }
  
  conformsToDefaultChange() {
    this.showVariations = this.form.value.conformsToDefault ? true : false
  }

  findStudyById(sdSid) {
    const arr: any = this.studyList.filter((item: any) => item.sdSid === sdSid);
    return arr && arr.length ? arr[0].displayTitle : 'None';
  }

  findObjectById(objectId) {
    const arr: any = this.objectList.filter((item: any) => item.objectId === objectId);
    return arr && arr.length ? arr[0].displayTitle : 'None';
  }

  checkUrl(instanceUrl) {
    // TODO: return different things if no valid URL, if TSD, or if external URL
    return (instanceUrl + '').includes('tsd.usit.no');
  }

  canUpload() {
    for (const aUser of this.associatedUsers) {
      if (aUser.person?.id === this.user.id) {
        return true;
      }
    }
    return false;
  }

  customSearchUsers(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.person?.firstName.toLocaleLowerCase().indexOf(term) > -1 
        || item.person?.lastName.toLocaleLowerCase().indexOf(term) > -1
        || item.person?.email.toLocaleLowerCase().indexOf(term) > -1
        || (item.person?.firstName.toLocaleLowerCase() + " " + item.person?.lastName.toLocaleLowerCase()).indexOf(term) > -1;
  }

  compareUsers(u1: any, u2: any) {
    return u1.id === u2.id;
  }

  goToTsd(instance) {
    // this.oidcSecurityService.getAccessToken().subscribe((userToken) => {
    //   const headers = new HttpHeaders();
    //   headers.set('Authorization', userToken);

    //   this.http.get(`https://api-v2.ecrin-rms.org/api/data-objects/${instance.objectId}`, {headers}).subscribe(res => {
    //     // @ts-ignore
    //     const objectId = res['data'][0].id;
    //     this.redirectService.postRedirect(instance.id, objectId, userToken);
    //   });
    // });

    this.oidcSecurityService.getAccessToken().subscribe((userToken) => {
      if (instance.sdIid && instance.sdOid) {
        this.redirectService.postRedirect(instance.sdIid, instance.sdOid, userToken);
      } else {
        this.toastr.error('Object ID or Object instance ID is undefined, please try to refresh the page.', 'Data object upload error');
      }
    });
  }

  goToDo(object) {
    if (object.dataObject?.sdOid) {
      this.router.navigate([`/data-objects/${object.dataObject.sdOid}/edit`]);
    } else {
      this.toastr.error('Data object ID is undefined, please try to navigate there manually.', 'Error navigating to data object page')
    }
  }

  ngOnDestroy() {
    this.scrollService.unsubscribeScroll();
  }

  protected readonly window = window;
}
