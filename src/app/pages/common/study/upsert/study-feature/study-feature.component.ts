import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, of, Subscription } from 'rxjs';
import { StudyFeatureValueInterface } from 'src/app/_rms/interfaces/study/study-feature-value.interface';
import { StudyLookupService } from 'src/app/_rms/services/entities/study-lookup/study-lookup.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';

@Component({
  selector: 'app-study-feature',
  templateUrl: './study-feature.component.html',
  styleUrls: ['./study-feature.component.scss']
})
export class StudyFeatureComponent implements OnInit {
  form: UntypedFormGroup;
  featureTypes: [] = [];
  featureValFiltered = [];
  featureValuesAll: [] = [];
  featureTypesFiltered = [];
  selectedStudyType: any;
  isBrowsing: boolean = false;
  isAdd: boolean = false;
  subscription: Subscription = new Subscription();
  arrLength = 0;
  len: any;
  hasInited: boolean = false;
  @Input() isView: boolean;
  @Input() isEdit: boolean;
  @Input() studyId: string;
  @Input() set initiateEmit(initiateEmit: any) {
    if (initiateEmit) {
      this.emitData();
    }
  }
  @Input() set studyType(studyType: any) {
    this.selectedStudyType = studyType.toLowerCase();
    if (this.hasInited) {
      this.studyTypeChange();
    }
  }
  @Output() emitFeature: EventEmitter<any> = new EventEmitter();
  studyFeatures = [];
  studyFeaturesAll = [];
  studyFeatureTypesSet = new Set();
  showAll: boolean = true;
  pageSize: Number = 10000;


  constructor(
    private fb: UntypedFormBuilder, 
    private router: Router,
    private studyService: StudyService, 
    private studyLookupService: StudyLookupService, 
    private spinner: NgxSpinnerService, 
    private toastr: ToastrService) {
    this.form = this.fb.group({
      studyFeatures: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.isBrowsing = this.router.url.includes('browsing') ? true : false;
    
    this.getStudyFeatures();
    this.hasInited = true;
  }

  getStudyFeaturesForm(): UntypedFormArray {
    return this.form.get('studyFeatures') as UntypedFormArray;
  }

  newStudyFeature(featureType): UntypedFormGroup {
    return this.fb.group({
      id: '',
      studyId: '',
      featureType: featureType,
      featureValue: null,
      alreadyExist: false
    });
  }

  patchArray() {
    const formArray = this.getStudyFeaturesForm();
    this.studyFeatures.forEach(feature => {
      formArray.push(this.fb.group({
        id: feature.id,
        featureType: feature.featureType,
        featureValue: feature.featureValue,
        studyId: feature.studyId
      }))
    });
  }

  getStudyFeatures() {
    /* Study features from the study */
    let getStudyFeatures$;
    // Not querying again in case of study type change and study features already contain features from selected type
    if ((this.studyFeaturesAll.filter((item: any) => item.featureType?.context === this.selectedStudyType)).length > 0) {
      getStudyFeatures$ = of({results: this.studyFeaturesAll});
    } else {
      getStudyFeatures$ = this.studyService.getStudyFeatures(this.studyId);
    }

    getStudyFeatures$.subscribe((res: any) => {
      if (res && res.results) {
        this.studyFeaturesAll = res.results.length ? res.results : [];
        this.studyFeatures = this.studyFeaturesAll.filter((item: any) => item.featureType?.context === this.selectedStudyType);
        if (this.studyFeatures.length > 0) {
          this.studyFeatures.sort((a, b) => a.featureType.name.localeCompare(b.featureType.name));
          this.isAdd = false;
          this.patchArray();
        } else {
          this.isAdd = true;
        }
        this.getFeatures().subscribe(([featureTypes, featureValues]) => {
          this.setFeatures(featureTypes, featureValues);
        });
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
  getFeatures() {
    const getFeatureType$ =  this.studyLookupService.getFeatureTypes(this.pageSize);
    const getFeatureValue$ = this.studyLookupService.getFeatureValues(this.pageSize);
    const combine$ = combineLatest([getFeatureType$, getFeatureValue$]);
    return combine$;
  }
  setFeatures(featureTypes, featureValues) {
    if (featureTypes.results) {
      this.featureTypes = featureTypes.results;
    }
    if (featureValues.results) {
      this.featureValuesAll = featureValues.results;
    }
    this.featureArrayFormation();
  }
  featureArrayFormation() {
    this.featureTypesFiltered = this.featureTypes.filter((item: any) => item.context === this.selectedStudyType);
    this.featureTypesFiltered.sort((a, b) => a.name.localeCompare(b.name));
    this.featureTypesFiltered.map((item1, index) => {
      this.featureValFiltered[index] = this.featureValuesAll.filter((item: any) => item.featureType.id === item1.id);
      if (this.isAdd) {
        this.getStudyFeaturesForm().push(this.newStudyFeature(item1.id));
      }
    });
  }
  onSave() {
    this.spinner.show();
    if (this.isAdd) {
      this.addFeatures();
    } else {
      this.editFeatures();
    }
  }

  updatePayload(payload) {
    if (this.isAdd) {
      payload.studyId = this.studyId;
      delete payload.id;
    }
    if (payload.featureValue?.id) {
      payload.featureValue = payload.featureValue.id;
    }
    if (payload.featureType?.id) {
      payload.featureType = payload.featureType.id;
    }
}
  addFeatures() {
    /* Add features to study object in DB */
    let addObs$ = [];
    JSON.parse(JSON.stringify(this.form.value.studyFeatures)).forEach(item => {
      this.updatePayload(item);
      addObs$.push(this.studyService.addStudyFeature(this.studyId, item));
    });

    combineLatest(addObs$).subscribe(combRes => {
      combRes.forEach((res: any, idx: number) => {
        if (res.statusCode === 201) {
          this.toastr.success(`Study Feature "${this.findFeatureType(res.featureType)}" added successfully`);
        } else {
          this.toastr.error(res.messages[0]);
        }
      }, error => {
        this.toastr.error(error.error.title);
      });

      (this.form.get('studyFeatures') as UntypedFormArray).clear();
      this.getStudyFeatures();
      this.spinner.hide();
    });
  }

  editFeatures() {
    /* Edit features of study object in DB */
    JSON.parse(JSON.stringify(this.form.value.studyFeatures)).forEach(item => {
      this.updatePayload(item);
      this.studyService.editStudyFeature(item.id, item.studyId, item).subscribe((res: any) => {
        this.spinner.hide();
        console.log(`edit res: ${JSON.stringify(res)}`);
        console.log(`${this.findFeatureType(res.featureType)}`);
        if (res.statusCode === 200) {
          this.toastr.success(`Study Feature "${this.findFeatureType(res.featureType)}" updated successfully`, '');
        } else {
          this.toastr.error(res.messages[0]);
        }
        this.isAdd = false;
      }, error => {
        this.spinner.hide();
        this.toastr.error(error.error.title);
      });
    });
  }
  findFeatureType(id) {
    const featureTypeArray: any = this.featureTypes.filter((type: any) => type.id === id);
    return featureTypeArray && featureTypeArray.length ? featureTypeArray[0].name : '';
  }
  findFeatureValue(id) {
    const featureValueArray: any = this.featureValuesAll.filter((type: any) => type.id === id);
    return featureValueArray && featureValueArray.length ? featureValueArray[0].name : '';
  }
  emitData() {
    const payload = this.form.value.studyFeatures.map(item => {
      if (!item.id) {
        delete item.id;
      }
      if (this.studyId) {
        item.studyId = this.studyId;
      }
      return item;
    })
    this.emitFeature.emit({ data: payload, isEmit: false });
  }
  studyTypeChange() {
    this.showAll = this.selectedStudyType === 'interventional' ? true : this.selectedStudyType === 'observational' ? false : true;
    (this.form.get('studyFeatures') as UntypedFormArray).clear();
    this.getStudyFeatures();
  }
  compareFeatVals(fv1: StudyFeatureValueInterface, fv2: StudyFeatureValueInterface): boolean {
    return fv1?.id == fv2?.id;
  }
  customSearchFeatVals(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1;
  }
  scrollToElement(): void {
    setTimeout(() => {
      const yOffset = -200; 
      const element = document.getElementById('featpanel'+this.len);
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
