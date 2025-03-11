import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest } from 'rxjs';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';


@Component({
    selector: 'app-studies-context',
    templateUrl: './studies-context.component.html'
})
export class StudiesContextComponent implements OnInit {
    list: any;
    listCopy: []= [];
    studyTypeList: [] = [];
    studyStatusList: [] = [];
    identifierTypeList: [] = [];
    titleTypeList: [] = [];
    featureTypeList: [] = [];
    featureValueList: [] = [];
    topicTypeList: [] = [];
    relationshipTypeList: [] = [];
    filterOption: string = 'all';

    constructor( private spinner: NgxSpinnerService, private studyService: StudyService, private toastr: ToastrService) {
    }

    ngOnInit() {
        // this.getAll();
    }

    // getAll() {
    //     const getStudyType$ = this.studyService.getStudyType();
    //     const getStudyStatus$ = this.studyService.getStudyStatus();
    //     const getIdentifierType$ = this.studyService.getIdentifierType();
    //     const getTitleType$ = this.studyService.getTitleType();
    //     const getFeatureType$ = this.studyService.getFeatureType();
    //     const getFeaturValue$ = this.studyService.getFeatureValue();
    //     const getTopicType$ = this.studyService.getTopicType();
    //     const getRelationshipType$ = this.studyService.getReleationshiType();
    //     this.spinner.show();
    //     const combine$ = combineLatest([
    //         getStudyType$,
    //         getStudyStatus$,
    //         getIdentifierType$,
    //         getTitleType$,
    //         getFeatureType$,
    //         getFeaturValue$,
    //         getTopicType$,
    //         getRelationshipType$
    //     ]).subscribe(([studyType, studyStatus, identifierType, Titletype, featureType, featureValue, topicType, relationshipType] : [any, any, any, any, any, any, any, any]) => {
    //         this.spinner.hide();
    //         if (studyType.data) {
    //             this.studyTypeList = studyType.data.map(item => {
    //                 item.type = 'studyType';
    //                 return item;
    //             })
    //         }
    //         if (studyStatus.data) {
    //             this.studyStatusList = studyStatus.data.map(item => {
    //                 item.type = 'studyStatus';
    //                 return item;
    //             })
    //         }
    //         if (identifierType.data) {
    //             this.identifierTypeList = identifierType.data.map(item => {
    //                 item.type = 'identifierType';
    //                 return item;
    //             })
    //         }
    //         if (Titletype.data) {
    //             this.titleTypeList = Titletype.data.map(item => {
    //                 item.type = 'titleType';
    //                 return item;
    //             })
    //         }
    //         if (featureType.data) {
    //             this.featureTypeList = featureType.data.map(item => {
    //                 item.type = 'featureType';
    //                 return item;
    //             })
    //         }
    //         if (featureValue.data) {
    //             this.featureValueList = featureValue.data.map(item => {
    //                 item.type = 'featureValue';
    //                 return item;
    //             })
    //         }
    //         if (topicType.data) {
    //             this.topicTypeList = topicType.data.map(item => {
    //                 item.type = 'topicType';
    //                 return item;
    //             })
    //         }
    //         if (relationshipType.data) {
    //             this.relationshipTypeList = relationshipType.data.map(item => {
    //                 item.type = 'relationshipType';
    //                 return item;
    //             })
    //         }
    //         this.list = [...this.studyTypeList, ... this.studyStatusList, ...this.identifierTypeList, ...this.titleTypeList, ...this.featureTypeList, ...this.featureValueList, ...this.topicTypeList, ...this.relationshipTypeList];
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
