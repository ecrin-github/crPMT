import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { StudyCTUInterface } from 'src/app/_rms/interfaces/study/study-ctus.interface';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { dateToString, getFlagEmoji, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { Observable, combineLatest, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { CTUInterface } from 'src/app/_rms/interfaces/context/ctu.interface';
import { StudyCountryInterface } from 'src/app/_rms/interfaces/study/study-country.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upsert-study-ctu',
  templateUrl: './upsert-study-ctu.component.html',
  styleUrls: ['./upsert-study-ctu.component.scss']
})
export class UpsertStudyCtuComponent implements OnInit {
  @Input() studyCTUsData: Array<StudyCTUInterface>;
  @Input() studyCountry: StudyCountryInterface;

  static intPatternValidatorFn: ValidatorFn = Validators.pattern("^[0-9]*$");

  form: UntypedFormGroup;
  submitted: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  ctus: CTUInterface[] = [];
  filteredCTUs: CTUInterface[] = [];

  studyCTUs: StudyCTUInterface[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private contextService: ContextService,
    private studyService: StudyService,
    private toastr: ToastrService) {
      this.form = this.fb.group({
        studyCTUs: this.fb.array([])
      });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');

    this.contextService.ctus.subscribe((ctus) => {
      this.ctus = ctus;
      if (this.ctus != null) {
        this.setFilteredCTUs();
      }
    });
  }

  get g() { return this.form.get('studyCTUs')["controls"]; }

  getControls(i) {
    return this.g[i].controls;
  }

  getStudyCTUsForm(): UntypedFormArray {
    return this.form.get('studyCTUs') as UntypedFormArray;
  }

  newStudyCTU(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      siteNumber: null,
      patientsExpected: [null, [UpsertStudyCtuComponent.intPatternValidatorFn]],
      recruitmentGreenlight: null,
      movExpectedNumber: [null, [UpsertStudyCtuComponent.intPatternValidatorFn]],
      study: null,
      studyCountry: null,
      ctu: [null, Validators.required],
      pi: null,
      piNationalCoordinator: false,
    });
  }

  patchForm() {
    this.form.setControl('studyCTUs', this.patchArray());
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.studyCTUs.forEach((sctu) => {
      formArray.push(this.fb.group({
        id: sctu.id,
        siteNumber: sctu.siteNumber,
        patientsExpected: [sctu.patientsExpected, [UpsertStudyCtuComponent.intPatternValidatorFn]],
        recruitmentGreenlight: sctu.recruitmentGreenlight ? stringToDate(sctu.recruitmentGreenlight) : null,
        movExpectedNumber: [sctu.movExpectedNumber, [UpsertStudyCtuComponent.intPatternValidatorFn]],
        study: sctu.study?.id,
        studyCountry: sctu.studyCountry?.id,
        ctu: sctu.ctu,
        pi: sctu.pi?.id,
        piNationalCoordinator: sctu.piNationalCoordinator,
      }))
    });
    return formArray;
  }

  setFilteredCTUs() {
    if (this.studyCountry?.country) {
      this.filteredCTUs = this.ctus.filter((item:any) => item.country.id === this.studyCountry.country.id);
    } else {
      this.filteredCTUs = [];
    }
  }

  // This function removes the explicit newlines characters but does not remove all newlines
  cleanAddress(address) {
    if (!address) {
      return null;
    }
    return address.replace("\n", " ");
  }

  toggleCTUInfo(event) {
    // TODO: aria-expanded on wrong element?
    const ctuInfoElement = event.target.closest(".ctuPanel").getElementsByClassName("ctuInfo")[0];
    const expanded = ctuInfoElement.getAttribute('aria-expanded') === 'true';
    ctuInfoElement.setAttribute('aria-expanded', `${!expanded}`);

    if (expanded) { // Reducing
      ctuInfoElement.classList.add("hideCTUInfo");
      ctuInfoElement.classList.remove("displayCTUInfo");

      event.target.classList.add("ctuToggleButtonClosed");
      event.target.classList.remove("ctuToggleButtonOpened");
    } else {  // Expanding
      ctuInfoElement.classList.add("displayCTUInfo");
      ctuInfoElement.classList.remove("hideCTUInfo");

      event.target.classList.add("ctuToggleButtonOpened");
      event.target.classList.remove("ctuToggleButtonClosed");
    }
  }

  displayCountryFlag() {
    if (this.studyCountry?.country?.iso2) {
      return getFlagEmoji(this.studyCountry.country.iso2);
    }
    return '';
  }

  ngOnChanges(changes: SimpleChanges) {
    let patchForm = false;
    if (changes.studyCountry?.previousValue?.country?.iso2 != changes.studyCountry?.currentValue?.country?.iso2) {
      if (this.ctus != null) {
        this.setFilteredCTUs();
      }
      patchForm = true;
    }
    
    if (changes.studyCTUsData) {
      if (this.studyCTUsData === null) {
        this.studyCTUs = [];
      } else {
        this.studyCTUs = this.studyCTUsData;
      }
      patchForm = true;
    }
    
    if (patchForm) {
      this.patchForm();
    }
  }

  addStudyCTU() {
    this.getStudyCTUsForm().push(this.newStudyCTU());
  }

  removeStudyCTU(i: number) {
    const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
    removeModal.componentInstance.itemType = "study CTU";

    removeModal.result.then((remove) => {
      if (remove) {
        const sctuId = this.getStudyCTUsForm().value[i].id;
        if (!sctuId) { // Study CTU has been locally added only
          this.getStudyCTUsForm().removeAt(i);
        } else {  // Existing study CTU
          this.studyService.deleteStudyCTUFromStudyCountry(this.studyCountry.id, sctuId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getStudyCTUsForm().removeAt(i);
              this.toastr.success('Study CTU deleted successfully');
            } else {
              this.toastr.error('Error when deleting study CTU', res.statusText);
            }
          }, error => {
            this.toastr.error(error.error.title);
          })
        }
      }
    }, error => {});
  }

  formValid() {
    this.submitted = true;
    
    // Manually checking CTU field (shouldn't be empty)
    for (const i in this.form.get("studyCTUs")['controls']) {
      if (this.form.get("studyCTUs")['controls'][i].value.ctu == null) {
        this.form.get("studyCTUs")['controls'][i].controls.ctu.setErrors({'required': true});
      }
    }

    return this.form.valid;
  }

  updatePayload(payload, scId, studyId) {
    payload.studyCountry = scId;
    payload.study = studyId;

    if (payload.recruitmentGreenlight) {
      payload.recruitmentGreenlight = dateToString(payload.recruitmentGreenlight);
    }

    if (payload.ctu?.id) {
      payload.ctu = payload.ctu.id;
    }

    if (payload.pi?.id) {
      payload.pi = payload.pi.id;
    }
  }

  onSave(scId: string, studyId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    JSON.parse(JSON.stringify(this.form.value.studyCTUs)).forEach(item => {
      this.updatePayload(item, scId, studyId);
      if (!item.id) { // Add
        saveObs$.push(this.studyService.addStudyCTUFromStudyCountry(scId, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 201) {
              return of(true);
            }
            return of(false);
          })
        ));
      } else {  // Edit
        saveObs$.push(this.studyService.editStudyCTUFromStudyCountry(scId, item.id, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              return of(true);
            }
            return of(false);
          })
        ));
      }
    });

    if (saveObs$.length == 0) {
      saveObs$.push(of(true));
    }

    return combineLatest(saveObs$);
  }

  dateToString(date) {
    return dateToString(date);
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }

  searchCTUs(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.name?.toLocaleLowerCase().indexOf(term) > -1 
        || item.shortName?.toLocaleLowerCase().indexOf(term) > -1 
        || item.addressInfo?.toLocaleLowerCase().indexOf(term) > -1;
  }
}
