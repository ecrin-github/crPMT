import { Component, HostListener, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { catchError, filter, finalize, map, pairwise, switchMap, timeout } from 'rxjs/operators';
import { DataObjectInterface } from 'src/app/_rms/interfaces/data-object/data-object.interface';
import { OrganisationInterface } from 'src/app/_rms/interfaces/context/organisation.interface';
import { StudyDataInterface } from 'src/app/_rms/interfaces/study/study.interface';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { CommonLookupService } from 'src/app/_rms/services/entities/common-lookup/common-lookup.service';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { JsonGeneratorService } from 'src/app/_rms/services/entities/json-generator/json-generator.service';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { ObjectLookupService } from 'src/app/_rms/services/entities/object-lookup/object-lookup.service';
import { PdfGeneratorService } from 'src/app/_rms/services/entities/pdf-generator/pdf-generator.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { stringToDate, dateToString } from 'src/assets/js/util';
import { RepoAccessTypeInterface } from 'src/app/_rms/interfaces/types/repo-access-type.interface';

@Component({
  selector: 'app-upsert-object',
  templateUrl: './upsert-object.component.html',
  styleUrls: ['./upsert-object.component.scss'],
  providers: [ScrollService]
})
export class UpsertObjectComponent implements OnInit {
  public isCollapsed: boolean = true;
  static showTopicTypes = ['publication list', 'journal article', 'working paper / pre-print'];
  objectForm: UntypedFormGroup;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  objectClasses: [] = [];
  objectTypes: [] = [];
  accessTypes: [] = [];
  keyTypes: [] = [];
  deidentificationTypes: [] = [];
  consentTypes: [] = [];
  languageCodes: [] = [];
  organisations: [] = [];
  organisationName: string;
  id: string;
  sdOid: string;
  totalInstances: number;
  objectData: DataObjectInterface;
  subscription: Subscription = new Subscription();
  initiateEmit: boolean = false;
  showDatasetKey: boolean = false;
  showTopic: boolean = false;
  showIdentifier: boolean = false;
  showDescription: boolean = false;
  sticky: boolean = false;
  EoscCategory = ['0', '1', '2', '3'];
  studyList: StudyDataInterface[] = [];
  resourceTypes: [] = [];
  sizeUnits: [] = [];
  titleTypes: [] = [];
  dateTypes: [] = [];
  topicTypes: [] = [];
  identifierTypes: [] = [];
  descriptionTypes: [] = [];
  minEmbargoDate: any;
  isManager: boolean;
  controlled: boolean = false;
  orgId: string;
  isSubmitted: boolean = false;
  isBrowsing: boolean = false;
  showEdit: boolean = false;
  pageSize: Number = 10000;

  constructor(private statesService: StatesService,
              private backService: BackService,
              private scrollService: ScrollService,
              private fb: UntypedFormBuilder, 
              private router: Router, 
              private commonLookupService: CommonLookupService, 
              private objectLookupService: ObjectLookupService, 
              private objectService: DataObjectService, 
              private spinner: NgxSpinnerService,
              private toastr: ToastrService, 
              private activatedRoute: ActivatedRoute, 
              private listService: ListService, 
              private reuseService: ReuseService,
              private pdfGenerator: PdfGeneratorService, 
              private jsonGenerator: JsonGeneratorService) {
    this.objectForm = this.fb.group({
      linkedStudy: null,
      doi: '',
      displayTitle: ['', Validators.required],
      version: '',
      objectClass: null,
      objectType: null,
      publicationYear: null,
      langCode: '',
      organisation: null,
      accessType: ['', Validators.required],
      embargoExpiry: null,
      accessDetails: '',
      accessDetailsUrl: '',
      eoscCategory: 0,
      objectDatasets: this.fb.group({
        recordkeyType: null,
        recordkeyDetails: '',
        deidentType: null,
        deidentDirect: false,
        deidentHipaa: false,
        deidentDates: false,
        deidentNonarr: false,
        deidentKanon: false,
        deidentDetails: '',
        consentType: null,
        consentNoncommercial: false,
        consentGeogRestrict: false,
        consentResearchType: false,
        consentGeneticOnly: false,
        consentNoMethods: false,
        consentDetails: '',
      }),
      objectInstances: [],
      objectTitles: [],
      objectDates: [],
      objectContributors: [],
      objectTopics: [],
      objectIdentifiers: [],
      objectDescriptions: [],
      objectRights: [],
      objectRelationships: [],
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.spinner.show(); 
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // TODO: check getMonth
    this.minEmbargoDate = {year: tomorrow.getFullYear(), month: tomorrow.getMonth()+1, day: tomorrow.getDate()};
    this.isAdd = this.router.url.includes('add') ? true : false;
    this.isEdit = this.router.url.includes('edit') ? true : false;
    this.isView = this.router.url.includes('view') ? true : false;
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;

    this.isManager = this.statesService.isManager();
    this.orgId = this.statesService.currentAuthOrgId;
    this.sdOid = this.activatedRoute.snapshot.params.id;
    if (!this.isManager) {
      this.objectForm.get('objectType').setValidators(Validators.required);
    }

    let queryFuncs: Array<Observable<any>> = [];

    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries
    if (this.isAdd) {
      queryFuncs.push(this.getNextDOSdOid());
    }

    if ((this.isEdit || this.isAdd) && (this.isManager)) {
      queryFuncs.push(this.getOrganisations());
    }
    if (this.isEdit || this.isView) {
      queryFuncs.push(this.getObjectById(this.sdOid));
    }

    this.scrollService.handleScroll([`/data-objects/${this.sdOid}/view`, `/browsing/data-objects/${this.sdOid}/view`, 
                                    `/data-objects/add`, `/data-objects/${this.sdOid}/edit`]);

    // Queries required even for view because of pdf/json exports
    queryFuncs.push(this.getResourceTypes());
    queryFuncs.push(this.getSizeUnits());
    queryFuncs.push(this.getTitleTypes());
    queryFuncs.push(this.getDateTypes());
    queryFuncs.push(this.getTopicTypes());
    queryFuncs.push(this.getIdentifierTypes());
    queryFuncs.push(this.getDescriptionTypes());
    queryFuncs.push(this.getConsentTypes());
    queryFuncs.push(this.getStudyList());
    queryFuncs.push(this.getObjectClasses());
    queryFuncs.push(this.getObjectTypes());
    queryFuncs.push(this.getAccessTypes());
    queryFuncs.push(this.getKeyTypes());
    queryFuncs.push(this.getDeidentificationTypes());
    queryFuncs.push(this.getLanguageCodes());

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error.error.title)))));
    });

    combineLatest(obsArr).subscribe(res => {
      this.setLanguageCodes(res.pop());
      this.setDeidentificationTypes(res.pop());
      this.setKeyTypes(res.pop());
      this.setAccessTypes(res.pop());
      this.setObjectTypes(res.pop());
      this.setObjectClasses(res.pop());
      this.setStudyList(res.pop());
      this.setConsentTypes(res.pop());
      this.setDescriptionTypes(res.pop());
      this.setIdentifierTypes(res.pop());
      this.setTopicTypes(res.pop());
      this.setDateTypes(res.pop());
      this.setTitleTypes(res.pop());
      this.setSizeUnits(res.pop());
      this.setResourceTypes(res.pop());

      if (this.isEdit || this.isView) {
        this.setObjectById(res.pop());
      }
      if ((this.isEdit || this.isAdd) && this.isManager) {
        this.setOrganisations(res.pop());
      }
      if (this.isAdd) {
        this.setDOSdOid(res.pop());
      }

      // TODO: still too early
      setTimeout(() => {
        this.spinner.hide(); 
      });
    });
  }

  get g() { return this.objectForm.controls; }
  get objectDatasetsControls() { return this.objectForm.controls['objectDatasets']['controls']; }

  public static isShowTopicType(objectType) {
    /* Object contributors and topics components appear only for specific object types */
    return UpsertObjectComponent.showTopicTypes.includes(objectType.toLowerCase());
  }

  getNextDOSdOid() {
    return this.objectService.getNextDOSdOid();
  }

  setDOSdOid(sdOidRes) {
    if ('sdOid' in sdOidRes) {
      this.sdOid = sdOidRes['sdOid'];
      this.objectForm.patchValue({
        'sdOid': sdOidRes['sdOid']
      });
    }
  }

  getStudyList() {
    let studyList$: Observable<Object>;
    if (!(this.isManager || this.isBrowsing)) {
      studyList$ = this.listService.getStudyListByOrg(this.orgId);
    } else {
      studyList$ = this.listService.getStudyList();
    }
    return studyList$;
  }

  setStudyList(studyList) {
    if (!this.isManager) {
      if (studyList) {
        this.studyList = studyList;
      }
    } else {
      if (studyList?.results) {
        this.studyList = studyList.results;
      }
    }
  }

  findStudyById(sdSid) {
    const arr: any = this.studyList.filter((item: any) => item.sdSid === sdSid);
    return arr && arr.length ? arr[0].displayTitle+'('+arr[0].sdSid+')' : ''
  }

  getObjectClasses() {
    return this.objectLookupService.getObjectClasses(this.pageSize);
  }

  setObjectClasses(objectClasses) {
    if (objectClasses?.results) {
      this.objectClasses = objectClasses.results;
    }
  }

  getObjectTypes() {
    return this.objectLookupService.getObjectTypes(this.pageSize);
  }

  setObjectTypes(objectTypes) {
    if (objectTypes?.results) {
      const { compare } = Intl.Collator('en-GB');
      this.objectTypes = objectTypes.results.sort((a, b) => compare(a.name, b.name));
    }
  }

  getAccessTypes() {
    return this.objectLookupService.getAccessTypes(this.pageSize);
  }

  setAccessTypes(accessTypes) {
    if (accessTypes?.results) {
      this.accessTypes = accessTypes.results;
    }
  }

  getKeyTypes() {
    return this.objectLookupService.getRecordKeyTypes(this.pageSize);
  }

  setKeyTypes(keyTypes) {
    if (keyTypes?.results) {
      this.keyTypes = keyTypes.results;
    }
  }

  getDeidentificationTypes() {
    return this.objectLookupService.getDeidentificationTypes(this.pageSize);
  }

  setDeidentificationTypes(deidentificationTypes) {
    if (deidentificationTypes?.results) {
      this.deidentificationTypes = deidentificationTypes.results;
    }
  }

  getConsentTypes() {
    return this.objectLookupService.getConsentTypes(this.pageSize);
  }

  setConsentTypes(consentTypes) {
    if (consentTypes?.results) {
      this.consentTypes = consentTypes.results;
    }
  }

  getLanguageCodes() {
    return this.commonLookupService.getLanguageCodes(this.pageSize);
  }

  setLanguageCodes(languageCodes) {
    if (languageCodes?.results) {
      const { compare } = Intl.Collator('en-GB');
      this.languageCodes = languageCodes.results.sort((a, b) => compare(a.langNameEn, b.langNameEn));
      if (this.isAdd) {
        this.objectForm.patchValue({
          langCode: this.findLangCode('English')
        });
      }
    }
  }

  getOrganisations() {
    return this.commonLookupService.getOrganizationList(this.pageSize);
  }

  setOrganisations(organisations) {
    if (organisations?.results) {
      this.organisations = organisations.results;
    }
  }

  getObjectById(id) {
    return this.objectService.getDataObjectById(id);
  }

  setObjectById(objectData) {
    if (objectData) {
      this.objectData = objectData;
      this.id = objectData.id;
      this.totalInstances = objectData.totalInstances;
      this.organisationName = objectData.organisation?.defaultName;
      // Check if user allowed to edit the object, in which case edit button is shown (for view)
      if (this.objectData.organisation?.id === this.orgId) {
        this.showEdit = true;
      }
      this.patchObjectForm();
    }
  }

  viewDate(date) {
    const dateArray = new Date(date);
    return date ? dateArray.getFullYear() + '/' 
        + (dateArray.getMonth()+1).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + '/' 
        + (dateArray.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) : '';
  }

  patchObjectForm() {
    const arr: any = this.objectClasses.filter((item:any) => item.name === 'Dataset');
    if (this.objectData.objectClass) {
      this.showDatasetKey = this.objectData.objectClass.id === arr[0].id ? true : false;
      let validators: any = [];
      if (this.showDatasetKey) {
        validators = [Validators.required];
      }
      this.objectForm.controls['objectDatasets']['controls']['recordkeyType'].setValidators(validators);
      this.objectForm.controls['objectDatasets']['controls']['recordkeyDetails'].setValidators(validators);
    }
    const arrType: any = this.objectTypes.filter((item: any) => UpsertObjectComponent.isShowTopicType(item.name));
    if(this.objectData.objectType) {
      arrType.map(item => {
        if (item.id === this.objectData.objectType.id) {
          this.showTopic = true;
          return;
        }
      });
    }
    this.objectForm.patchValue({
      linkedStudy: this.objectData.linkedStudy ? this.objectData.linkedStudy : null,
      doi: this.objectData.doi,
      displayTitle: this.objectData.displayTitle,
      version: this.objectData.version,
      objectClass: this.objectData.objectClass ? this.objectData.objectClass.id : null,
      objectType: this.objectData.objectType ? this.objectData.objectType : null,
      publicationYear: this.objectData.publicationYear ? new Date(`01/01/${this.objectData.publicationYear}`) : '',
      langCode: this.objectData.langCode ? this.objectData.langCode.id : null,
      organisation: this.objectData.organisation ? this.objectData.organisation.id : null,
      accessType: this.objectData.accessType ? this.objectData.accessType : null,
      accessDetails: this.objectData.accessDetails,
      accessDetailsUrl: this.objectData.accessDetailsUrl,
      embargoExpiry: this.objectData.embargoExpiry ? stringToDate(this.objectData.embargoExpiry) : null,
      eoscCategory: this.objectData.eoscCategory,
      objectDatasets: {
        recordkeyType: this.objectData.objectDatasets[0] ? this.objectData.objectDatasets[0].recordkeyType ? this.objectData.objectDatasets[0].recordkeyType.id : null :null,
        recordkeyDetails: this.objectData.objectDatasets[0] ? this.objectData.objectDatasets[0].recordkeyDetails :'',
        consentType: this.objectData.objectDatasets[0] ? this.objectData.objectDatasets[0].consentType ? this.objectData.objectDatasets[0].consentType.id :null :null,
        consentNoncommercial: this.objectData.objectDatasets[0] ? this.objectData.objectDatasets[0].consentNoncommercial : false,
        consentGeogRestrict: this.objectData.objectDatasets[0] ? this.objectData.objectDatasets[0].consentGeogRestrict : false,
        consentResearchType: this.objectData.objectDatasets[0] ? this.objectData.objectDatasets[0].consentResearchType : false,
        consentGeneticOnly: this.objectData.objectDatasets[0] ? this.objectData.objectDatasets[0].consentGeneticOnly : false,
        consentNoMethods: this.objectData.objectDatasets[0] ? this.objectData.objectDatasets[0].consentNoMethods : false,
        consentDetails: this.objectData.objectDatasets[0] ? this.objectData.objectDatasets[0].consentDetails :'',
      },
      objectInstances: this.objectData.objectInstances ? this.objectData.objectInstances : [],
      objectTitles: this.objectData.objectTitles ? this.objectData.objectTitles : [],
      objectDates: this.objectData.objectDates ? this.objectData.objectDates : [],
      objectContributors: this.objectData.objectContributors ? this.objectData.objectContributors : [],
      objectTopics: this.objectData.objectTopics ? this.objectData.objectTopics : [],
      objectIdentifiers: this.objectData.objectIdentifiers ? this.objectData.objectIdentifiers : [],
      objectDescriptions: this.objectData.objectDescriptions ? this.objectData.objectDescriptions : [],
      objectRights: this.objectData.objectRights ? this.objectData.objectRights : [],
      objectRelationships: this.objectData.objectRelationships ? this.objectData.objectRelationships : []
    });
    this.setControlled();
  }

  onSave() {
    this.spinner.show();
    if (localStorage.getItem('updateObjectList')) {
      localStorage.removeItem('updateObjectList');
    }
    this.isSubmitted = true;
    if (this.objectForm.valid) {
      const payload = {
        sdOid: this.sdOid,
        displayTitle: this.objectForm.value.displayTitle,
        version: this.objectForm.value.version,
        doi: this.objectForm.value.doi,
        publicationYear: this.objectForm.value.publicationYear ? this.objectForm.value.publicationYear.getFullYear() : null,
        accessDetails: this.objectForm.value.accessDetails,
        accessDetailsUrl: this.objectForm.value.accessDetailsUrl,
        embargoExpiry: this.objectForm.value.embargoExpiry ? dateToString(this.objectForm.value.embargoExpiry) : null,
        urlLastChecked: this.objectForm.value.urlLastChecked,
        addStudyContributors: true,
        addStudyTopics: true,
        linkedStudy: this.objectForm.value.linkedStudy ? this.objectForm.value.linkedStudy.id : null,
        objectClass: this.objectForm.value.objectClass ? this.objectForm.value.objectClass : null,
        objectType: this.objectForm.value.objectType ? this.objectForm.value.objectType.id : null,
        organisation: this.objectForm.value.organisation ? this.objectForm.value.organisation : null,
        langCode: this.objectForm.value.langCode,
        accessType: this.objectForm.value.accessType ? this.objectForm.value.accessType.id : null
      }
      const datasetPayload = {
        recordkeyType: this.objectForm.value.objectDatasets.recordkeyType,
        recordkeyDetails: this.objectForm.value.objectDatasets.recordkeyDetails,
        deidentType: this.objectForm.value.objectDatasets.deidentType,
        deidentDirect: this.objectForm.value.objectDatasets.deidentDirect,
        deidentHipaa: this.objectForm.value.objectDatasets.deidentHipaa,
        deidentDates: this.objectForm.value.objectDatasets.deidentDates,
        deidentNonarr: this.objectForm.value.objectDatasets.deidentNonarr,
        deidentKanon: this.objectForm.value.objectDatasets.deidentKanon,
        deidentDetails: this.objectForm.value.objectDatasets.deidentDetails,
        consentType: this.objectForm.value.objectDatasets.consentType,
        consentNoncommercial: this.objectForm.value.objectDatasets.consentNoncommercial,
        consentGeogRestrict: this.objectForm.value.objectDatasets.consentGeogRestrict,
        consentResearchType: this.objectForm.value.objectDatasets.consentResearchType,
        consentGeneticOnly: this.objectForm.value.objectDatasets.consentGeneticOnly,
        consentNoMethods: this.objectForm.value.objectDatasets.consentNoMethods,
        consentDetails: this.objectForm.value.objectDatasets.consentDetails,
        objectId: this.id
      }
      if (this.isEdit) {
        if (payload.linkedStudy === null || payload.linkedStudy === undefined) {
          this.spinner.hide();
          this.toastr.error("You have to specify linked study");
        } else {
          const editDataObject$ = this.objectService.editDataObject(this.id, payload);
          const editDataset$ = this.objectData.objectDatasets.length > 0 ? this.objectService.editObjectDataset(this.objectData.objectDatasets[0].id, this.id, datasetPayload) : this.objectService.addObjectDataset(this.id, datasetPayload);
          const combine$ = combineLatest([editDataObject$, editDataset$]).subscribe(([editRes, datasetRes] : [any, any]) => {
            if (editRes.statusCode === 200 && datasetRes.statusCode === 200) {
              this.toastr.success('Data Object updated successfully');
              localStorage.setItem('updateObjectList', 'true');
              // this.getObjectById(this.id);
              this.reuseService.notifyComponents();
              this.spinner.hide();
              this.router.navigate([`/data-objects/${this.sdOid}/view`]);
            }
          }, error => {
            this.spinner.hide();
            this.toastr.error(error.error.title);
          })
        }
      } else {  // this.isAdd
        if (payload.linkedStudy === null || payload.linkedStudy === undefined) {
          this.spinner.hide();
          this.toastr.error("You have to specify linked study");
        } else {
          this.objectService.addDataObject(payload).pipe(
            timeout(10000),
            map((res: any) => {
              if (res.statusCode === 201) {
                datasetPayload.objectId = res.id;
                this.objectService.addObjectDataset(res.id, datasetPayload).pipe(
                  map((res2: any) => {
                    if (res2.statusCode === 201) {
                      this.toastr.success('Data Object added successfully');
                      localStorage.setItem('updateObjectList', 'true');
                      this.reuseService.notifyComponents();
                      if (res.sdOid) {
                        this.router.navigate([`/data-objects/${res.sdOid}/view`]);
                      } else {
                        this.back();
                      }
                    } else {
                      throw new Error(res2.message);
                    }
                  })
                ).subscribe();
              } else {
                throw new Error(res.message);
              }
            }),
            finalize(() => this.spinner.hide()),
            catchError(err => {
              this.toastr.error(err.message, 'Error when adding DO');
              return of(false);
            })
          ).subscribe();
        }
      }
    } else {
      this.gotoTop();
      this.spinner.hide();
      this.toastr.error("Please correct the errors in the form's fields.");
    }
  }
  // findObjectClass(id) {
  //   const objectClassArray: any = this.objectClass.filter((type: any) => type.id === id);
  //   return objectClassArray && objectClassArray.length ? objectClassArray[0].name : '';
  // }
  // findobjectType(id) {
  //   const objectTypeArray: any = this.objectType.filter((type: any) => type.id === id);
  //   return objectTypeArray && objectTypeArray.length ? objectTypeArray[0].name : '';
  // }
  // findAccessType(id) {
  //   const accessTypeArray: any = this.accessType.filter((type: any) => type.id === id);
  //   return accessTypeArray && accessTypeArray.length ? accessTypeArray[0].name : '';
  // }
  // findKeyType(id) {
  //   const keyTypeArray: any = this.keyType.filter((type: any) => type.id === id);
  //   return keyTypeArray && keyTypeArray.length ? keyTypeArray[0].name : 'None';
  // }
  // findDeidentificationType(id) {
  //   const deidentificationArray: any = this.deidentificationType.filter((type: any) => type.id === id);
  //   return deidentificationArray && deidentificationArray.length ? deidentificationArray[0].name : 'None';
  // }

  findConsentType(id) {
    const consentTypeArray: any = this.consentTypes.filter((type: any) => type.id === id);
    return consentTypeArray && consentTypeArray.length ?consentTypeArray[0].name : 'None';
  }

  findLangCode(languageCode) {
    setTimeout(() => {
      const langArr: any = this.languageCodes.filter((type: any) => type.languageCode === languageCode);
      return langArr && langArr.length? langArr[0].id : '';
    }, 2000);
  }

  back(): void {
    this.backService.back();
  }

  onChange() {
    const arr: any = this.objectClasses.filter((item:any) => item.name.toLowerCase() === 'dataset');
    this.showDatasetKey = this.objectForm.value.objectClass === arr[0].id ? true : false;
    if (this.showDatasetKey) {
      const validators = [Validators.required];
      this.objectForm.controls['objectDatasets']['controls']['recordkeyType'].setValidators(validators);
      this.objectForm.controls['objectDatasets']['controls']['recordkeyDetails'].setValidators(validators);
    } else {
      this.objectForm.controls['objectDatasets']['controls']['recordkeyType'].clearValidators();
      this.objectForm.controls['objectDatasets']['controls']['recordkeyType'].setErrors(null);
      this.objectForm.controls['objectDatasets']['controls']['recordkeyDetails'].clearValidators();
      this.objectForm.controls['objectDatasets']['controls']['recordkeyDetails'].setErrors(null);
    }
  }

  onTypeChange() {
    this.showTopic = false;
    const arrType: any = this.objectTypes.filter((item: any) => UpsertObjectComponent.isShowTopicType(item.name));
    for (let item of arrType) {
      if (item.id === this.objectForm.value.objectType) {
        this.showTopic = true;
        break;
      }
    }
  }

  printPdf() {
    const payload = JSON.parse(JSON.stringify(this.objectData));
    this.pdfGenerator.objectPdfGenerator(payload);
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
    const payload = JSON.parse(JSON.stringify(this.objectData));
    this.cleanJSON(payload);
    this.jsonGenerator.jsonGenerator(payload, 'object');
  }

  /* code to get values for id for generating pdf and json */
  getSizeUnits() {
    return this.objectLookupService.getSizeUnits(this.pageSize);
  }

  setSizeUnits(sizeUnits) {
    if (sizeUnits?.results) {
      this.sizeUnits = sizeUnits.results;
    }
  }

  findSizeUnit(id) {
    const sizeArray: any = this.sizeUnits.filter((type: any) => type.id === parseInt(id));
    return sizeArray && sizeArray.length ? sizeArray[0].name : '';
  }

  getResourceTypes() {
    return this.objectLookupService.getResourceTypes(this.pageSize);
  }

  setResourceTypes(resourceTypes) {
    if (resourceTypes?.results) {
      this.resourceTypes = resourceTypes.results;
    }
  }

  findResourceType(id) {
    const resourceArray: any = this.resourceTypes.filter((type: any) => type.id === id);
    return resourceArray && resourceArray.length ? resourceArray[0].name : '';
  }

  getTitleTypes() {
    return this.objectLookupService.getObjectTitleTypes(this.pageSize);
  }

  setTitleTypes(titleTypes) {
    if (titleTypes?.results) {
      this.titleTypes = titleTypes.results;
    }
  }

  findTitleType(id) {
    const titleTypeArray: any = this.titleTypes.filter((type: any) => type.id === id);
    return titleTypeArray && titleTypeArray.length ? titleTypeArray[0].name : ''
  }

  getDateTypes() {
    return this.objectLookupService.getDateTypes(this.pageSize);
  }

  setDateTypes(dateTypes) {
    if (dateTypes?.results) {
      this.dateTypes = dateTypes.results;
    }
  }

  findDateType(id) {
    const dateTypeArray: any = this.dateTypes.filter((type: any) => type.id === id);
    return dateTypeArray && dateTypeArray.length ? dateTypeArray[0].name : '';
  }

  getTopicTypes() {
    return this.commonLookupService.getTopicTypes(this.pageSize);
  }

  setTopicTypes(topicTypes) {
    if (topicTypes?.results) {
      this.topicTypes = topicTypes.results;
    }
  }

  findTopicType(id) {
    const topicTypeArrray: any = this.topicTypes.filter((type: any) => type.id === id);
    return topicTypeArrray && topicTypeArrray.length ? topicTypeArrray[0].name : '';
  }

  getIdentifierTypes() {
    return this.objectLookupService.getObjectIdentifierTypes(this.pageSize);
  }

  setIdentifierTypes(identifierTypes) {
    if (identifierTypes?.results) {
      this.identifierTypes = identifierTypes.results;
    }
  }

  findIdentifierType(id) {
    const identifierTypeArray: any = this.identifierTypes.filter((type: any) => type.id === id);
    return identifierTypeArray && identifierTypeArray.length ? identifierTypeArray[0].name : '';
  }

  getDescriptionTypes() {
    return this.objectLookupService.getDescriptionTypes(this.pageSize);
  }

  setDescriptionTypes(descriptionTypes) {
    if (descriptionTypes?.results) {
      this.descriptionTypes = descriptionTypes.results;
    }
  }

  findDescriptionType(id) {
    const descriptionArray: any = this.descriptionTypes.filter((type: any) => type.id === id);
    return descriptionArray && descriptionArray.length ? descriptionArray[0].name : '';
  }

  onChangeParentStudy() {
    if (!this.objectForm.value.linkedStudy) {
      this.organisationName = "";
    } else if (!this.objectForm.value.linkedStudy.organisation) {
      this.organisationName = "Parent study doesn't have an organisation";
    } else {
      this.organisationName = this.objectForm.value.linkedStudy.organisation.defaultName;
    }
    this.objectForm.patchValue({
      organisation: this.objectForm.value.linkedStudy?.organisation ? this.objectForm.value.linkedStudy.organisation.id : null
    })
  }

  customSearchStudies(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.sdSid?.toLocaleLowerCase().indexOf(term) > -1 || item.displayTitle.toLocaleLowerCase().indexOf(term) > -1;
  }

  customSearchObjectTypes(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1;
  }

  compareStudies(s1: StudyDataInterface, s2: StudyDataInterface): boolean {
    return s1?.id == s2?.id;
  }

  customSearchOrganisations(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.defaultName.toLocaleLowerCase().indexOf(term) > -1;
  }

  compareOrganisations(o1: OrganisationInterface, o2: OrganisationInterface): boolean {
    return o1?.id === o2?.id;
  }

  compareAccessTypes(at1: RepoAccessTypeInterface, at2: RepoAccessTypeInterface): boolean {
    return at1?.id === at2?.id;
  }
  
  compareObjectTypes(ot1, ot2): boolean {
    return ot1?.id === ot2?.id;
  }

  setControlled() {
    this.controlled = (this.objectForm.value.accessType?.name?.toLocaleLowerCase() === 'controlled');
    this.showControlledDetails();
  }

  showControlledDetails() {
    if (this.controlled) {
      this.g['accessDetails'].setValidators([Validators.required]);
    } else {
      this.g['accessDetails'].clearValidators();
      this.g['accessDetails'].setErrors(null);
    }
  }
  
  gotoTop() {
    window.scroll({ 
      top: 0, 
      left: 0, 
      behavior: 'smooth' 
    });
  }

  ngOnDestroy() {
    this.scrollService.unsubscribeScroll();
    this.subscription.unsubscribe();
  }
}
