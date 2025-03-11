import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { DupService } from 'src/app/_rms/services/entities/dup/dup.service';
import { JsonGeneratorService } from 'src/app/_rms/services/entities/json-generator/json-generator.service';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { PdfGeneratorService } from 'src/app/_rms/services/entities/pdf-generator/pdf-generator.service';
import { ProcessLookupService } from 'src/app/_rms/services/entities/process-lookup/process-lookup.service';
import { CommonModalComponent } from '../../common-modal/common-modal.component';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { catchError, finalize, map, mergeMap } from 'rxjs/operators';
import { dateToString, isWholeNumber, stringToDate } from 'src/assets/js/util';
import { UserInterface } from 'src/app/_rms/interfaces/user/user.interface';

@Component({
  selector: 'app-upsert-dup',
  templateUrl: './upsert-dup.component.html',
  styleUrls: ['./upsert-dup.component.scss'],
  providers: [ScrollService]
})
export class UpsertDupComponent implements OnInit {
  form: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  organizationList:[] = [];
  statusList = [];
  id: any;
  dupData: any;
  sliceLength = 100;
  associatedStudies: any = [];
  associatedObjects: any = [];
  associatedUsers: any = [];
  todayDate: any;
  submitted: boolean = false;
  nextStep: number;
  buttonClick: any;
  showVariations: boolean = false;
  sticky: boolean = false;
  dupArr: any;
  studyList: [] = [];
  objectList: [] = [];
  role: any;
  user: UserInterface;
  isManager: boolean = false;
  showUploadButton: boolean = false;
  addDOButtonDisabled: boolean = true;
  pageSize: Number = 10000;
  duaData: any;
  dupNotes: any;
  prereqs: any[] = [];
  dataObjectIds: any;
  stepperFields = {
    1: ["setUpStartDate", "setUpCompleteDate"],
    2: ["prereqsMetDate", "duaAgreedDate"],
    3: ["availabilityRequestedDate", "availabilityExpiryDate"]
  }
  currentStep: number = 1;
  maxSteps: number = 3;
  lastCompletedStep: number = -1;
  storedDatesError = {1: [], 2: [], 3: []};

  constructor(private statesService: StatesService,
              private backService: BackService,
              private scrollService: ScrollService,
              private router: Router, 
              private fb: UntypedFormBuilder, 
              private dupService: DupService, 
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService,
              private activatedRoute: ActivatedRoute, 
              private modalService: NgbModal, 
              private reuseService: ReuseService,
              private commonLookup: CommonLookupService, 
              private processLookup: ProcessLookupService, 
              private pdfGeneratorService: PdfGeneratorService,
              private jsonGenerator: JsonGeneratorService, 
              private listService: ListService) {
    this.form = this.fb.group({
      organisation: ['', Validators.required],
      displayName: ['', Validators.required],
      status: '',
      setUpStartDate: null,
      setUpCompleteDate: null,
      prereqsMetDate: null,
      duaAgreedDate: null,
      availabilityRequestedDate: null,
      availabilityExpiryDate: null,
      secondaryUseReason: '',
      conformsToDefault: false,
      variations: '',
      repoIsProxyProvider: false,
      duaFilePath: '',
      repoSignatory1: '',
      repoSignatory2: '',
      providerSignatory1: '',
      providerSignatory2: '',
      requesterSignatory1: '',
      requesterSignatory2: '',
      notes: this.fb.array([])
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.spinner.show(); 
    });

    this.role = this.statesService.currentAuthRole;
    this.id = this.activatedRoute.snapshot.params.id;
    const todayDate = new Date();
    this.todayDate = {year: todayDate.getFullYear(), month: todayDate.getMonth()+1, day: todayDate.getDate()};

    this.isEdit = this.router.url.includes('edit') ? true : false;
    this.isView = this.router.url.includes('view') ? true : false;
    this.isManager = this.statesService.isManager();
    this.user = this.statesService.currentUser;

    this.scrollService.handleScroll([`/data-use/${this.id}/view`, `/data-use/${this.id}/edit`, `/data-use/add`]);

    if (this.router.url.includes('add')) {
      this.form.patchValue({
        setUpStartDate: this.todayDate
      })
    }

    let queryFuncs: Array<Observable<any>> = [];

    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries
    if (this.isEdit || this.isView) {
      queryFuncs.push(this.getDupObjectsAndPrereqs(this.id));
      queryFuncs.push(this.getDupNotes(this.id));
      queryFuncs.push(this.getDupPeople(this.id));
      queryFuncs.push(this.getDupStudies(this.id));
      queryFuncs.push(this.getDua(this.id));
      queryFuncs.push(this.getDupById(this.id));
    }

    queryFuncs.push(this.getObjectList());
    queryFuncs.push(this.getStudyList());
    queryFuncs.push(this.getStatus());
    queryFuncs.push(this.getOrganisation());

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error.error.title)))));
    });

    combineLatest(obsArr).subscribe(res => {
      this.setOrganisation(res.pop());
      this.setStatus(res.pop());
      this.setStudyList(res.pop());
      this.setObjectList(res.pop());

      if (this.isEdit || this.isView) {
        this.setDupById(res.pop());
        this.setDua(res.pop());
        this.setDupStudies(res.pop());
        this.setDupPeople(res.pop());
        this.setDupNotes(res.pop());
        // getDupObjectsAndPrereqs doesn't return a value
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
    this.storedDatesError = {1: [], 2: [], 3: []};;
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
      } else if (currDateField === 'prereqsMetDate') {
        errorMessage = 'Prerequisites met date cannot be earlier than Setup completed date';
      } else if (currDateField === 'duaAgreedDate') {
        errorMessage = 'Data Use Agreement date cannot be earlier than Prerequisites met completed date';
      } else if (currDateField === 'availabilityRequestedDate') {
        errorMessage = 'Availability requested date cannot be earlier than Data Use Agreement date';
      } else if (currDateField === 'availabilityExpiryDate') {
        errorMessage = 'Availability expires date cannot be earlier than Availability requested completed date';
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
  newDupNote(): UntypedFormGroup {
    return this.fb.group({
      dupId: '',
      text: '',
      alreadyExist: false,
      author: this.statesService.currentUser,
    })
  }
  addDupNote() {
    this.notes().push(this.newDupNote());
  }
  patchNote(notes) {
    this.form.setControl('notes', this.patchNoteArray(notes));
  }
  patchNoteArray(notes): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    notes.forEach(note => {
      formArray.push(this.fb.group({
        id: note.id,
        dupId: note.dupId,
        text: note.text,
        alreadyExist: true,
        author: note.author
      }))
    });
    return formArray;
  }

  getDupNotes(id) {
    return this.dupService.getDupNotes(id);
  }

  setDupNotes(res) {
    if (res?.results) {
      this.patchNote(res.results);
      this.dupNotes = res.results;
    }
  }

  deleteDupNote(i) {
    if (this.notes().value[i].alreadyExist) {
      this.spinner.show();
      this.dupService.deleteDupNote(this.notes().value[i].id, this.id).subscribe((res: any) => {
        this.getDupNotes(this.id).subscribe((res) => {
          this.setDupNotes(res);
          this.toastr.success('Note deleted successfully');
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

  saveDupNote(note) {
    // TODO: fix error of editing right after adding
    this.spinner.show();
    const payload = {
      'id': note.value.id,
      'author': note.value.author?.id ? note.value.author.id : note.value.author,
      'text': note.value.text,
      'createdOn': note.value.createdOn,
      'dupId': note.value.dupId,
    };
    if (note.value.alreadyExist) {
      this.dupService.editDupNote(payload.id, this.id, payload).subscribe((res: any) => {
        if (res.statusCode === 200) {
          this.toastr.success('Note updated successfully');
        } else {
          this.toastr.error(res.messages[0]);
        }
        this.spinner.hide();
      }, error => {
        this.spinner.hide();
        this.toastr.error(error.error.title);
      })
    } else {
      payload.dupId = this.id;
      this.dupService.addDupNote(this.id, payload).subscribe((res: any) => {
        note.value.alreadyExist = true;
        if (res.statusCode === 201) {
          note.value.id = res?.id;
          note.value.dupId = res?.dupId;
          this.toastr.success('Note added successfully');
        } else {
          this.toastr.error(res.messages[0]);
        }
        this.spinner.hide();
      }, error => {
        this.spinner.hide();
        this.toastr.error(error.error.title);
      })
    }
  }
  
  get g() { return this.form.controls; }

  getOrganisation() {
    return this.commonLookup.getOrganizationList(this.pageSize);
  }

  setOrganisation(res) {
    if (res?.results) {
      this.organizationList = res.results;
    }
  }

  getStatus() {
    return this.processLookup.getDupStatusTypes();
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
    if (localStorage.getItem('updateDupList')) {
      localStorage.removeItem('updateDupList');
    }

    const payload = JSON.parse(JSON.stringify(this.form.value));
    payload.setUpStartDate = this.dateToString(payload.setUpStartDate);
    payload.setUpCompleteDate = this.dateToString(payload.setUpCompleteDate);
    payload.prereqsMetDate = this.dateToString(payload.prereqsMetDate);
    payload.duaAgreedDate = this.dateToString(payload.duaAgreedDate);
    payload.availabilityRequestedDate = this.dateToString(payload.availabilityRequestedDate);
    payload.availabilityExpiryDate = this.dateToString(payload.availabilityExpiryDate);

    if (payload.repoSignatory1?.id) {
      payload.repoSignatory1 = payload.repoSignatory1.id;
    }
    if (payload.repoSignatory2?.id) {
      payload.repoSignatory2 = payload.repoSignatory2.id;
    }
    if (payload.providerSignatory1?.id) {
      payload.providerSignatory1 = payload.providerSignatory1.id;
    }
    if (payload.providerSignatory2?.id) {
      payload.providerSignatory2 = payload.providerSignatory2.id;
    }
    if (payload.requesterSignatory1?.id) {
      payload.requesterSignatory1 = payload.requesterSignatory1.id;
    }
    if (payload.requesterSignatory2?.id) {
      payload.requesterSignatory2 = payload.requesterSignatory2.id;
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
          payload.dupId = this.id;
          this.spinner.show();
          const editCoreDup$ = this.dupService.editDup(this.id, payload);
          const editDua$ = this.duaData?.length ? this.dupService.editDua(this.id, this.duaData[0].id, payload) : this.dupService.addDua(this.id, payload);
          delete payload.notes;
          const combine$ = combineLatest([editCoreDup$, editDua$]).subscribe(([coreDupRes, duaRes] : [any, any]) => {
            let success: boolean = true;
            if (!(coreDupRes.statusCode === 200 || coreDupRes.statusCode === 201)) {
              success = false;
              this.toastr.error(coreDupRes.messages[0]);
            }
            if (!(duaRes.statusCode === 200 || duaRes.statusCode === 201)) {
              success = false;
              this.toastr.error(duaRes.messages[0]);
            }
            this.spinner.hide();
            if (success) {
              this.toastr.success('DUP updated successfully');
              localStorage.setItem('updateDupList', 'true');
              this.reuseService.notifyComponents();
              this.router.navigate([`/data-use/${this.id}/view`]);
            }
          }, error => {
            this.spinner.hide();
            this.toastr.error(error.error.title);
          })
        } else {
          this.spinner.show();
          this.dupService.addDup(payload).subscribe((res: any) => {
            if (res.statusCode === 201) {
              this.toastr.success('DUP added successfully');
              localStorage.setItem('updateDupList', 'true');
              this.reuseService.notifyComponents();
              if (res.id) {
                this.router.navigate([`/data-use/${res.id}/view`]);
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

  getDupById(id) {
    return this.dupService.getDupById(id);
  }

  setDupById(res) {
    if (res) {
      this.dupData = res;
      this.patchForm(this.dupData);
    }
  }

  getDua(id) {
    return this.dupService.getDua(id);
  }

  setDua(res) {
    if (res?.results) {
      this.duaData = res.results;
      this.patchDua(this.duaData);
    }
  }

  patchForm(data) {
    this.form.patchValue({
      organisation: data.organisation ? data.organisation.id : null,
      displayName: data.displayName,
      status: data.status,
      setUpStartDate: this.stringToDate(data.setUpStartDate),
      setUpCompleteDate: this.stringToDate(data.setUpCompleteDate),
      prereqsMetDate: this.stringToDate(data.prereqsMetDate),
      duaAgreedDate: this.stringToDate(data.duaAgreedDate),
      availabilityRequestedDate: this.stringToDate(data.availabilityRequestedDate),
      availabilityExpiryDate: this.stringToDate(data.availabilityExpiryDate),
    });

    let found: boolean = false;
    let i = this.maxSteps;

    // Note: i >= 1 instead of i > i is wrong here
    while (!found && i > 1) {
      for (let field of this.stepperFields[i]) {
        if (this.dupData[field]) {
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
  
    // if (this.form.value.initialContactDate !== null && this.form.value.initialContactDate !== '' && this.form.value.setUpCompleteDate !== null && this.form.value.setUpCompleteDate !== '' && this.form.value.prereqsMetDate !== null && this.form.value.prereqsMetDate !== '' &&
    // this.form.value.duaAgreedDate !== null && this.form.value.duaAgreedDate !== '' && this.form.value.availabilityRequestedDate !== null && this.form.value.availabilityRequestedDate !== '' && this.form.value.availabilityConfirmedDate !== null && this.form.value.availabilityConfirmedDate !== '') {
    //   this.showUploadButton = this.role ? true : false;
    // }
  }

  patchDua(data) {
    this.form.patchValue({
      secondaryUseReason: data[0]?.secondaryUseReason,
      variations: data[0]?.variations,
      conformsToDefault: data[0]?.conformsToDefault,
      repoIsProxyProvider: data[0]?.repoIsProxyProvider,
      duaFilePath: data[0]?.duaFilePath,
      repoSignatory1: data[0]?.repoSignatory1,
      repoSignatory2: data[0]?.repoSignatory2,
      providerSignatory1: data[0]?.providerSignatory1,
      providerSignatory2: data[0]?.providerSignatory2,
      requesterSignatory1: data[0]?.requesterSignatory1,
      requesterSignatory2: data[0]?.requesterSignatory2,
    });
    this.showVariations = data[0]?.conformsToDefault ? true : false;
  }

  findOrganization(id) {
    const organizationArray: any = this.organizationList.filter((type: any) => type.id === id);
    return organizationArray && organizationArray.length ? organizationArray[0].defaultName : 'None'
  }

  findStatus(id) {
    const statusArray: any = this.statusList.filter((type: any) => type.id === id);
    return statusArray && statusArray.length ? statusArray[0].name : 'None';
  }

  back(): void {
    this.backService.back();
  }

  addStudy() {
    const studyModal = this.modalService.open(CommonModalComponent, { size: 'xl', backdrop: 'static' });
    studyModal.componentInstance.title = 'Add Studies';
    studyModal.componentInstance.type = 'study';
    studyModal.componentInstance.dupId = this.id;
    studyModal.componentInstance.currentStudiesIds = new Set(this.associatedStudies.map((item) => item.study?.id));
    studyModal.componentInstance.currentObjectsIds = new Set(this.associatedObjects.map((item) => item.dataObject?.id));
    studyModal.result.then((data) => {
      if (data) {
        this.spinner.show();
        setTimeout(() => {
          combineLatest([
            this.getDupObjectsAndPrereqs(this.id),
            this.getDupStudies(this.id),
          ]).subscribe((res) => {
            this.setDupStudies(res.pop());
            // getDupObjectsAndPrereqs doesn't return a value
            this.spinner.hide();
          })
        });
      }
    }, error => {});
  }

  getDupStudies(id) {
    return this.dupService.getDupStudies(id);
  }

  setDupStudies(res) {
    if (res?.results?.length > 0) {
      this.getSortedDupStudies(res.results);
      this.associatedStudies = res.results;
      if (this.associatedStudies.length > 0) {
        this.addDOButtonDisabled = false;
      }
    }
  }

  removeDupStudy(dupStudy) {
    this.spinner.show();
    this.commonLookup.objectInvolvementDup(this.id, dupStudy.study?.id).subscribe((res: any) => {
      if (res.studyAssociated && res.objectsAssociated) {
        this.toastr.error(`Object(s) linked to this study are linked to this DUP. Remove the object(s) before removing this study.`);
        this.spinner.hide();
      } else {
        this.dupService.deleteDupStudy(dupStudy.id, this.id).subscribe((res: any) => {
          this.getDupStudies(this.id).subscribe((res) => {
            this.setDupStudies(res);
            this.toastr.success('Study has been disassociated successfully');
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
    const dataModal = this.modalService.open(CommonModalComponent, { size: 'xl', backdrop: 'static' });
    dataModal.componentInstance.title = 'Add Data Objects';
    dataModal.componentInstance.type = 'dataObject';
    dataModal.componentInstance.dupId = this.id;
    dataModal.componentInstance.currentStudiesIds = new Set(this.associatedStudies.map((item) => item.study?.id));
    dataModal.componentInstance.currentObjectsIds = new Set(this.associatedObjects.map((item) => item.dataObject?.id));
    dataModal.result.then((data) => {
      if (data) {
        this.spinner.show();
        setTimeout(() => {
          this.getDupObjectsAndPrereqs(this.id).subscribe(() => this.spinner.hide());
        });
      }
    }, error => { })
  }

  getDupObjectsAndPrereqs(id) {
    return this.dupService.getDupObjects(id).pipe(
      mergeMap((res: any) => {
        if (res?.results?.length > 0) {
          this.getSortedDupObjects(res.results);
          this.associatedObjects = res.results;
          this.dataObjectIds = this.associatedObjects.map((assocDo: any) => assocDo.dataObject.id);
          return this.getDupObjectPrereqs(this.dataObjectIds);
        }
        return of(false);
      }),
      map((res) => {
        this.setDupObjectPrereqs(res);
      })
    );
  }

  getDupObjectPrereqs(dataObjectsIds) {
    return this.dupService.getDupObjectPrereqs(dataObjectsIds);
  }

  setDupObjectPrereqs(res) {
    if (res?.data) {
      this.prereqs = this.dataObjectIds.map(() => []);
      res.data.forEach((prereq) => {
        const ind = this.dataObjectIds.indexOf(prereq?.dtpDataObject?.dataObject?.id);
        if (ind > -1) {
          this.prereqs[ind].push(prereq);
        }
      })
    }
  }

  removeDupObject(id) {
    this.spinner.show();
    this.dupService.deleteDupObject(id, this.id).subscribe((res: any) => {
      this.getDupObjectsAndPrereqs(this.id).subscribe(() => {
        this.toastr.success('Data object has been disassociated successfully');
        this.spinner.hide();
      });
    }, error => {
      this.toastr.error(error.error.title);
    })
  }

  getSortedDupStudies(studies) {
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
            return compare(a.study?.sdSid, b.study?.sdSid);
          }
        }
      }
      return -1;
    });
  }

  getSortedDupObjects(objects) {
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

  addUser() {
    const userModal = this.modalService.open(CommonModalComponent, {size: 'xl', backdrop: 'static'});
    userModal.componentInstance.title = 'Add Users';
    userModal.componentInstance.type = 'user';
    userModal.componentInstance.dupId = this.id;
    userModal.componentInstance.currentUsersIds = new Set(this.associatedUsers.map((item) => item.person?.id));
    userModal.result.then((data) => {
      if (data) {
        this.spinner.show();
        setTimeout(() => {
          this.getDupPeople(this.id).subscribe((res) => {
            this.setDupPeople(res);
            this.spinner.hide();
          });
        });
      }
    }, error => {})
  }

  getDupPeople(id) {
    return this.dupService.getDupPeople(id);
  }

  setDupPeople(res) {
    if (res) {
      this.associatedUsers = res.results ? res.results : [];
    }
  }

  findPeopleById(id) {
    const arr: any = this.associatedUsers.filter((item: any) => item.id === id);
    return arr && arr.length ? arr[0].person?.firstName + ' ' + arr[0].person?.lastName : 'None';
  }

  removeDupUser(id) {
    this.spinner.show();
    this.dupService.deleteDupPerson(id, this.id).pipe(
      mergeMap(() => {
        return this.getDupPeople(this.id);
      }),
      mergeMap((res) => {
        this.setDupPeople(res);
        return this.getDua(this.id);
      }),
      map((res) => {
        this.setDua(res);
        this.toastr.success('User has been dissociated successfully');
      }),
      finalize(() => this.spinner.hide()),
      catchError(err => {
        this.toastr.error(err.message, 'Error during user dissociation');
        return of(false);
      })
    ).subscribe();
  }

  conformsToDefaultChange() {
    this.showVariations = this.form.value.conformsToDefault ? true : false
  }

  printDocument() {
    const payload = JSON.parse(JSON.stringify(this.dupData));
    payload.associatedStudies = this.associatedStudies;
    payload.associatedObjects = this.associatedObjects;
    payload.associatedUsers = this.associatedUsers;
    payload.prereqs = ([] as string[]).concat(...this.prereqs);
    this.pdfGeneratorService.dupPdfGenerator(payload);
  }

  jsonExport() {
    const payload = JSON.parse(JSON.stringify(this.dupData));
    /*payload.coreDup.organisation = this.findOrganization(payload.coreDup.organisation);
    payload.coreDup.status = this.findStatus(payload.coreDup.status);
    payload.coreDup.initialContactDate = this.viewDate(payload.coreDup.initialContactDate);
    payload.coreDup.setUpCompleteDate = this.viewDate(payload.coreDup.setUpCompleteDate);
    payload.coreDup.prereqsMetDate = this.viewDate(payload.coreDup.prereqsMetDate);
    payload.coreDup.duaAgreedDate = this.viewDate(payload.coreDup.duaAgreedDate);
    payload.coreDup.availabilityRequestedDate = this.viewDate(payload.coreDup.availabilityRequestedDate);
    payload.coreDup.availabilityConfirmedDate = this.viewDate(payload.coreDup.availabilityConfirmedDate);
    payload.coreDup.accessConfirmedDate = this.viewDate(payload.coreDup.accessConfirmedDate);
    payload.duas[0].repoSignatory1 = this.findPeopleById(payload.duas[0].repoSignatory1);
    payload.duas[0].repoSignatory2 = this.findPeopleById(payload.duas[0].repoSignatory2);
    payload.duas[0].providerSignatory1 = this.findPeopleById(payload.duas[0].providerSignatory1);
    payload.duas[0].providerSignatory2 = this.findPeopleById(payload.duas[0].providerSignatory2);
    payload.duas[0].requesterSignatory1 = this.findPeopleById(payload.duas[0].requesterSignatory1);
    payload.duas[0].requesterSignatory2 = this.findPeopleById(payload.duas[0].requesterSignatory2);

    payload.dupNotes.map(item => {
      item.author = this.findPeopleById(item.author);
      item.createdOn = this.viewDate(item.createdOn);
    });
    payload.dupObjects.map(item => {
      item.objectName = this.findObjectById(item.objectId);
    });
    payload.dupStudies.map(item => {
      item.studyName = this.findStudyById(item.sdSid);
    });*/
    this.jsonGenerator.jsonGenerator(payload, 'dup');
  }

  getStudyList() {
    return this.listService.getStudyList();
  }

  setStudyList(res) {
    if (res?.data) {
      this.studyList = res.data;
    }
  }

  getObjectList() {
    return this.listService.getObjectList();
  }

  setObjectList(res) {
    if (res?.data) {
      this.objectList = res.data;
    }
  }

  findStudyById(studyId) {
    const arr: any = this.studyList.filter((item: any) => item.studyId === studyId);
    return arr && arr.length ? arr[0].displayTitle : 'None';
  }

  findObjectById(objectId) {
    const arr: any = this.objectList.filter((item: any) => item.objectId === objectId);
    return arr && arr.length ? arr[0].displayTitle : 'None';
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

  checkUrl(instanceUrl) {
    // TODO: return different things if no valid URL, if TSD, or if external URL
    return (instanceUrl + '').includes('tsd.usit.no');
  }

  canAccess() {
    for (const aUser of this.associatedUsers) {
      if (aUser.person?.id === this.user.id) {
        return true;
      }
    }
    return false;
  }

  goToTsd() {
    this.router.navigate([])
    .then(result => { window.open('https://crdsr.tsd.usit.no/', '_blank'); });
  }

  ngOnDestroy() {
    this.scrollService.unsubscribeScroll();
  }
}
