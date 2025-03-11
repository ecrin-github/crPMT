import {Component, OnInit} from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest } from 'rxjs';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';


@Component({
    selector: 'app-object-context',
    templateUrl: './objects-context.component.html'
})
export class ObjectsContextComponent implements OnInit {
    list: any;
    listCopy: [] = [];
    objectClassList: [] = [];
    objectTypeList: [] = [];
    accessTypeList:[] = [];
    keyTypeList: [] = [];
    deidentificationTypeList: [] = [];
    consentTypeList: [] = [];
    resourceTypeList: [] = [];
    titleTypeList: [] = [];
    dateTypeList: [] = [];
    contributorTypeList: [] = [];
    topicTypeList: [] = [];
    identifierTypeList: [] = [];
    descritionTypeList: [] = [];
    relationshipTypeList: [] = [];
    filterOption: string = 'all';


    constructor( private spinner: NgxSpinnerService, private objectService: DataObjectService, private toastr: ToastrService, private studyService: StudyService) {
    }

    ngOnInit() {
        // this.getAll();
    }
    // getAll() {
    //     const getObjectClass$ = this.objectService.getObjectClass();
    //     const getObjectType$ = this.objectService.getObjectType();
    //     const getAccessType$ = this.objectService.getAccessType();
    //     const getKeyType$ = this.objectService.getKeyTypes();
    //     const getDeidentificationType$ = this.objectService.getDeidentificationTypes();
    //     const getConsentType$ = this.objectService.getConsentType();
    //     const getResourceType$ = this.objectService.getResourceType();
    //     const getTitleType$ = this.studyService.getTitleType();
    //     const getDateType$ = this.objectService.getDateType();
    //     const getContributorType$ = this.objectService.getContributorType();
    //     const getTopicType$ = this.studyService.getTopicType();
    //     const getIdentifierType$ = this.studyService.getIdentifierType();
    //     const getDescriptionType$ = this.objectService.getDescriptionType();
    //     const getRelationshipType$ = this.objectService.getRelationshipType();
    //     this.spinner.show();
    //     const combine$ = combineLatest([
    //         getObjectClass$,
    //         getObjectType$,
    //         getAccessType$,
    //         getKeyType$,
    //         getDeidentificationType$,
    //         getConsentType$,
    //         getResourceType$,
    //         getTitleType$,
    //         getDateType$,
    //         getContributorType$,
    //         getTopicType$,
    //         getIdentifierType$,
    //         getDescriptionType$,
    //         getRelationshipType$
    //     ]).subscribe(([objectClass, objectType, accessType, keyType, deidentificationType, consentType, resourceType, titleType, dateType, contributorType, topicType, identifierType, descritionType, relationshipType]: [any, any, any, any, any, any,any, any, any,any, any, any, any, any]) => {
    //         this.spinner.hide();
    //         if (objectClass.data) {
    //             this.objectClassList = objectClass.data.map(item => {
    //                 item.type = 'objectClass';
    //                 return item;
    //             })
    //         }
    //         if (objectType.data) {
    //             this.objectTypeList = objectType.data.map(item => {
    //                 item.type = 'objectType';
    //                 return item;
    //             })
    //         }
    //         if (accessType.data) {
    //             this.accessTypeList = accessType.data.map(item => {
    //                 item.type = 'accessType';
    //                 return item;
    //             })
    //         }
    //         if (keyType.data) {
    //             this.keyTypeList = keyType.data.map(item => {
    //                 item.type = 'keyType';
    //                 return item;
    //             })
    //         }
    //         if (deidentificationType.data) {
    //             this.deidentificationTypeList = deidentificationType.data.map(item => {
    //                 item.type = 'deidentificationType';
    //                 return item;
    //             })
    //         }
    //         if (consentType.data) {
    //             this.consentTypeList = consentType.data.map(item => {
    //                 item.type = 'consentType';
    //                 return item;
    //             })
    //         }
    //         if (resourceType.data) {
    //             this.resourceTypeList = resourceType.data.map(item => {
    //                 item.type = 'resourceType';
    //                 return item;
    //             })
    //         }
    //         if (titleType.data) {
    //             this.titleTypeList = titleType.data.map(item => {
    //                 item.type = 'titleType';
    //                 return item;
    //             })
    //         }
    //         if (dateType.data) {
    //             this.dateTypeList = dateType.data.map(item => {
    //                 item.type = 'dateType';
    //                 return item;
    //             })
    //         }
    //         if (contributorType.data) {
    //             this.contributorTypeList = contributorType.data.map(item => {
    //                 item.type = 'contributorType';
    //                 return item;
    //             })
    //         }
    //         if (topicType.data) {
    //             this.topicTypeList = topicType.data.map(item => {
    //                 item.type = 'topicType';
    //                 return item;
    //             })
    //         }
    //         if (identifierType.data) {
    //             this.identifierTypeList = identifierType.data.map(item => {
    //                 item.type = 'identifierType';
    //                 return item;
    //             })
    //         }
    //         if (descritionType.data) {
    //             this.descritionTypeList = descritionType.data.map(item => {
    //                 item.type = 'descritionType';
    //                 return item;
    //             })
    //         }
    //         if (relationshipType.data) {
    //             this.relationshipTypeList = relationshipType.data.map(item => {
    //                 item.type = 'relationshipType';
    //                 return item;
    //             })
    //         }
    //         this.list = [...this.objectClassList, ...this.objectTypeList, ...this.accessTypeList, ...this.keyTypeList, ...this.deidentificationTypeList, ...this.consentTypeList, ...this.resourceTypeList, ...this.titleTypeList, ...this.dateTypeList, ...this.contributorTypeList, ...this.topicTypeList, ...this.identifierTypeList, ...this.descritionTypeList, ...this.relationshipTypeList];
    //         this.listCopy = JSON.parse(JSON.stringify(this.list));
    //     }, error => {
    //         this.spinner.hide();
    //     })
    // }
    onChange() {
        if (this.filterOption === 'all') {
            this.list = JSON.parse(JSON.stringify(this.listCopy));

        } else {
            this.list = this.listCopy.filter((item:any) => item.type === this.filterOption)
        }
    }

}
