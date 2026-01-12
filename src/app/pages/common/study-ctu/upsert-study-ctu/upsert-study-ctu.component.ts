import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { StudyCTUInterface } from 'src/app/_rms/interfaces/core/study-ctus.interface';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { dateToString, getFlagEmoji, getTagBgColor, getTagBorderColor, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { CTUInterface } from 'src/app/_rms/interfaces/context/ctu.interface';
import { StudyCountryInterface } from 'src/app/_rms/interfaces/core/study-country.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { UpsertCentreComponent } from '../../centre/upsert-centre/upsert-centre.component';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { StudyCtuService } from 'src/app/_rms/services/entities/study-ctu/study-ctu.service';
import { ClassValueInterface } from 'src/app/_rms/interfaces/context/class-value.interface';
import { CentreService } from 'src/app/_rms/services/entities/centre/centre.service';

@Component({
  selector: 'app-upsert-study-ctu',
  templateUrl: './upsert-study-ctu.component.html',
  styleUrls: ['./upsert-study-ctu.component.scss']
})
export class UpsertStudyCtuComponent implements OnInit {
  @ViewChildren('centres') centreComponents: QueryList<UpsertCentreComponent>;
  @Input() studyCTUsData: Array<StudyCTUInterface>;
  @Input() studyCountry: StudyCountryInterface;

  static intPatternValidatorFn: ValidatorFn = Validators.pattern("^[0-9]*$");

  id: string;
  form: UntypedFormGroup;
  submitted: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  isSctuPage: boolean = false;
  ctus: CTUInterface[] = [];
  services: ClassValueInterface[] = [];

  studyCTUs: StudyCTUInterface[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private backService: BackService,
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private contextService: ContextService,
    private spinner: NgxSpinnerService, 
    private studyCTUService: StudyCtuService,
    private centreService: CentreService,
    private toastr: ToastrService) {
      this.form = this.fb.group({
        studyCTUs: this.fb.array([])
      });
  }

  ngOnInit(): void {
    if (this.router.url.includes('study-ctus')) {
      this.id = this.activatedRoute.snapshot.params.id;
      this.isSctuPage = true;
    }

    if (this.isSctuPage) {
      setTimeout(() => {
        this.spinner.show();
      });
    }

    this.isAdd = this.router.url.includes('add');
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');

    let queryFuncs: Array<Observable<any>> = [];

    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries
    if (this.isSctuPage && !this.isAdd) {
      queryFuncs.push(this.getStudyCTU(this.id));
    }

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error)))));
    });

    combineLatest(obsArr).subscribe(res => {
      if (this.isSctuPage && !this.isAdd) {
        this.setStudyCTU(res.pop());
      }

      setTimeout(() => {
        this.spinner.hide();
      });
    });

    this.contextService.ctus.subscribe((ctus) => {
      this.ctus = ctus;
      if (this.ctus != null) {
        this.sortCTUs();
      }
    });

    this.contextService.services.subscribe((services) => {
      this.services = services;
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
      leadCtu: false,
      services: [],
      study: null,
      studyCountry: this.studyCountry,
      ctu: [null, Validators.required],
      centres: null
    });
  }

  getStudyCTU(id) {
    return this.studyCTUService.getStudyCTU(id);
  }

  setStudyCTU(sctuData) {
    if (sctuData) {
      delete sctuData["statusCode"];
      this.studyCTUs = [sctuData];
      this.id = sctuData.id;
      this.patchForm();
      // if (this.ctus?.length > 0) {
      //   this.sortCTUs();
      // }
    }
  }

  patchForm() {
    this.form.setControl('studyCTUs', this.patchArray());
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.studyCTUs.forEach((sctu) => {
      formArray.push(this.fb.group({
        id: sctu.id,
        leadCtu: sctu.leadCtu,
        services: [sctu.services],
        study: sctu.study,
        studyCountry: sctu.studyCountry,
        ctu: sctu.ctu,
        centres: [sctu.centres]
      }))
    });
    return formArray;
  }

  sortCTUs() {
    const countryISO2 = this.studyCountry?.country ? this.studyCountry.country.iso2 : this.form.value.studyCTUs[0]?.studyCountry?.country?.iso2;
    if (countryISO2) {
      const { compare } = Intl.Collator('en-GB');

      this.ctus.sort((a, b) => {
        if (a.country.iso2?.localeCompare(countryISO2) == 0) {
          if (b.country.iso2?.localeCompare(countryISO2) == 0) {
            return compare(a.shortName + a.name, b.shortName + b.name); // TODO: short name?
          }
          return -1;
        } else if (b.country.iso2?.localeCompare(countryISO2) == 0) {
          return 1;
        } else {  // Sorting by country + name if none of the CTUs match the current country
          const countryCompare = a.country.name?.localeCompare(b.country.name);
          if (countryCompare > 0) {
            return 1;
          } else if (countryCompare < 0) {
            return -1;
          } else {
            return compare(a.shortName + a.name, b.shortName + b.name); // TODO: short name?
          }
        }
      });
    } else {
      console.log("Could not get country ID to sort CTUs");
    }
  }

  // This function removes the explicit newlines characters but does not remove all newlines
  cleanAddress(address) {
    if (!address) {
      return null;
    }
    return address.replace("\n", " ");
  }

  toggleCTUInfo(event) {  // Unused
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

  getCountryFlag() {
    if (this.studyCountry?.country?.iso2) {
      return getFlagEmoji(this.studyCountry.country.iso2);
    }
    return '';
  }

  getCountryFlagFromIso2(iso2) {
    return getFlagEmoji(iso2);
  }

  onChangeCTU(i) {  // Unused
    let existingStudyCTU = null;
    for (const sctu of this.studyCTUs) {
      if (sctu?.ctu?.id === this.g[i].value?.ctu?.id) {
        existingStudyCTU = sctu;
        break;
      }
    }

    if (existingStudyCTU) {
      delete existingStudyCTU["order"];
      this.getStudyCTUsForm().at(i).setValue(existingStudyCTU);
    } else {
      const ctu = this.g[i].value.ctu;
      this.g[i].reset();
      this.getStudyCTUsForm().at(i).patchValue({ctu: ctu});

      const centreC = this.centreComponents.get(i);

      if (centreC.getCentresForm().controls.length == 0) {
        centreC.addCentre();
      }
    }
  }

  searchClassValues = (term: string, item) => {
    return this.contextService.searchClassValues(term, item);
  }

  addService = (value) => {
    return this.contextService.addServiceDropdown(value);
  }

  deleteService($event, sToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (sToRemove.id == -1) {  // Created locally by user
      this.services = this.services.filter(s => !(s.id == sToRemove.id && s.value == sToRemove.value));
    } else {  // Already existing
      this.contextService.deleteServiceDropdown(sToRemove, !this.isAdd);
    }
  }

  getTagBorderColor(text) {
    return getTagBorderColor(text);
  }

  getTagBgColor(text) {
    return getTagBgColor(text);
  }

  ngOnChanges(changes: SimpleChanges) {
    let patchForm = false;
    if (changes.studyCountry?.previousValue?.country?.iso2 != changes.studyCountry?.currentValue?.country?.iso2) {
      if (this.ctus != null) {
        this.sortCTUs();
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

  deleteStudyCTU($event, i: number) {
    $event.stopPropagation(); // Expands the panel otherwise
    const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
    removeModal.componentInstance.itemType = "study CTU";

    removeModal.result.then((remove) => {
      if (remove) {
        const sctuId = this.getStudyCTUsForm().value[i].id;
        if (!sctuId) { // Study CTU has been locally added only
          this.getStudyCTUsForm().removeAt(i);
        } else {  // Existing study CTU
          this.studyCTUService.deleteStudyCTU(sctuId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getStudyCTUsForm().removeAt(i);

              // Removing study CTU from studyCTUs list, otherwise there will be a failing API call to delete it on save
              this.studyCTUs = this.studyCTUs.filter((item:any) => item.id != sctuId);
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

  isFormValid() {
    this.submitted = true;
    
    // Manually checking CTU field (shouldn't be empty)
    for (const i in this.form.get("studyCTUs")['controls']) {
      if (this.form.get("studyCTUs")['controls'][i].value.ctu == null) {
        this.form.get("studyCTUs")['controls'][i].controls.ctu.setErrors({'required': true});
      }
    }

    if (!this.form.valid) {
      this.toastr.error("Please correct the errors in the study CTUs form");
    }

    return this.form.valid && !this.centreComponents.some(b => !b.isFormValid());
  }

  updatePayload(payload, scId, studyId, i) {
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

    if (payload.services?.length > 0) {
      for (let i = 0; i < payload.services.length; i++) {
        if (payload.services[i]?.id) {
          payload.services[i] = payload.services[i].id;
        }
      }
    } else {
      payload.services = [];
    }

    // Note: needs to be changed if possible to add a new study CTU not from the higher level pages
    if (!this.isSctuPage) {
      payload.order = i;
    }
  }

  onSave(scId: string, studyId: string): Observable<boolean[]> {
      this.submitted = true;
      let saveObs$: Array<Observable<boolean>> = [];
  
      // Used to check for study CTUs that have been "soft deleted" from the interface, 
      // as in by switching CTU for an existing study CTU rather than deleting the study CTU and making a new one
      const sctuIds: Array<Number> = this.studyCTUs.map((item: StudyCTUInterface) => {return item.id;});
  
      const payload = JSON.parse(JSON.stringify(this.form.value));
  
      for (const [i, item] of payload.studyCTUs.entries()) {
        this.updatePayload(item, scId, studyId, i);
        if (!item.id) {  // Add
  
          saveObs$.push(this.studyCTUService.addStudyCTUFromStudy(studyId, item).pipe(
            mergeMap((res: any) => {
              if (res.statusCode === 201) {
                return this.centreComponents.get(i).onSave(res.id, studyId).pipe(
                  mergeMap((success) => {
                    if (success) {
                      return of(true);
                    }
                    return of(false);
                  })
                );
              }
              return of(false);
            })
          ));
        } else {  // Edit
          // See comment above
          const index = sctuIds.indexOf(item.id, 0);
          if (index > -1) {
            sctuIds.splice(index, 1);
          }
  
          const sctuObs$ = this.centreComponents.get(i).onSave(item.id, item.study).pipe(
            mergeMap((successArr: boolean[]) => {
              const success: boolean = successArr.every(b => b);
              if (!success) {
                this.toastr.error('Failed to update centres');
              }
              return of(success);
            })
          );
  
          saveObs$.push(sctuObs$);
  
          // TODO: don't do editObs if sctuObs$ false?
          
          const scObs$ = this.studyCTUService.editStudyCTU(item.id, item).pipe(
            mergeMap((res: any) => {
              if (res.statusCode === 200) {
                // this.reuseService.notifyComponents();
                return of(true);
              } else {
                this.toastr.error(res.detail);
                return of(false);
              }
            }), catchError(err => {
              this.toastr.error(err);
              return of(false);
            })
          );
  
          saveObs$.push(scObs$);
        }
      }
  
      sctuIds.forEach((scId) => {
        saveObs$.push(this.studyCTUService.deleteStudyCTU(scId).pipe(
          mergeMap((res: any) => {
            if (res.status === 204) {
              return of(true);
            } else {
              this.toastr.error(res);
              return of(false);
            }
          }), catchError(err => {
            this.toastr.error(err);
            return of(false);
          }))
        );
      });
  
      if (saveObs$.length == 0) {
        saveObs$.push(of(true));
      }
  
      return combineLatest(saveObs$);
  }

  onSaveStudyCtu() {
    this.spinner.show();

    if (this.isFormValid()) {
      const studyId = this.form.value?.studyCTUs[0]?.study?.id;
      const scId = this.form.value?.studyCTUs[0]?.studyCountry?.id;
      if (scId && studyId) {
        this.onSave(scId, studyId).subscribe((success) => {
          this.spinner.hide();
          if (success) {
            this.toastr.success("Data saved successfully");
            this.router.navigate([`/study-ctus/${this.id}/view`]);
          }
        });
      } else {
        this.spinner.hide();
        this.toastr.error("Couldn't get study and/or study country ID from study CTU");
      }
    }
  }

  dateToString(date) {
    return dateToString(date);
  }

  compareIds(fv1, fv2): boolean {
    return fv1?.id == fv2?.id;
  }

  searchCTUs(term: string, item) {
    return this.contextService.searchCTUs(term, item);
  }
  
  back(): void {
    this.backService.back();
  }
}
