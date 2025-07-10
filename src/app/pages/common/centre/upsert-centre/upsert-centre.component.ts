import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { CentreInterface } from 'src/app/_rms/interfaces/study/centre.interface';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { CTUInterface } from 'src/app/_rms/interfaces/context/ctu.interface';
import { Router } from '@angular/router';
import { AddPersonModalComponent } from '../../add-person-modal/add-person-modal.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { ProjectInterface } from 'src/app/_rms/interfaces/project/project.interface';
import { PersonInterface } from 'src/app/_rms/interfaces/person.interface';
import { StudyCTUInterface } from 'src/app/_rms/interfaces/study/study-ctus.interface';

@Component({
  selector: 'app-upsert-centre',
  templateUrl: './upsert-centre.component.html',
  styleUrls: ['./upsert-centre.component.scss']
})
export class UpsertCentreComponent implements OnInit {
  @Input() centresData: Array<CentreInterface>;
  @Input() studyCTU: StudyCTUInterface;
  @Input() projectId: string;

  static intPatternValidatorFn: ValidatorFn = Validators.pattern("^[0-9]*$");

  form: UntypedFormGroup;
  submitted: boolean = false;
  isEdit: boolean = false;
  isView: boolean = false;
  isAdd: boolean = false;
  persons: PersonInterface[] = [];

  centres: CentreInterface[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private spinner: NgxSpinnerService,
    private listService: ListService,
    private contextService: ContextService,
    private studyService: StudyService,
    private toastr: ToastrService) {
      this.form = this.fb.group({
        centres: this.fb.array([])
      });
  }

  ngOnInit(): void {
    this.isEdit = this.router.url.includes('edit');
    this.isView = this.router.url.includes('view');
    this.isAdd = this.router.url.includes('add');

    this.contextService.persons.subscribe((persons) => {
      this.persons = persons;
    });
  }

  get g() { return this.form.get('centres')["controls"]; }

  getControls(i) {
    return this.g[i].controls;
  }

  getCentresForm(): UntypedFormArray {
    return this.form.get('centres') as UntypedFormArray;
  }

  newCentre(): UntypedFormGroup {
    return this.fb.group({
      id: null,
      siteNumber: null,
      patientsExpected: [null, [UpsertCentreComponent.intPatternValidatorFn]],
      recruitmentGreenlight: null,
      movExpectedNumber: [null, [UpsertCentreComponent.intPatternValidatorFn]],
      town: null,
      hospital: null,
      firstPatientVisit: null,
      studyCtu: null,
      pi: null,
      piNationalCoordinator: false,
    });
  }

  patchForm() {
    this.form.setControl('centres', this.patchArray());
  }

  patchArray(): UntypedFormArray {
    const formArray = new UntypedFormArray([]);
    this.centres.forEach((centre) => {
      formArray.push(this.fb.group({
        id: centre.id,
        siteNumber: centre.siteNumber,
        patientsExpected: [centre.patientsExpected, [UpsertCentreComponent.intPatternValidatorFn]],
        recruitmentGreenlight: centre.recruitmentGreenlight ? stringToDate(centre.recruitmentGreenlight) : null,
        movExpectedNumber: [centre.movExpectedNumber, [UpsertCentreComponent.intPatternValidatorFn]],
        town: centre.town,
        hospital: centre.hospital,
        firstPatientVisit: centre.firstPatientVisit ? stringToDate(centre.firstPatientVisit) : null,
        study: centre.study?.id,
        studyCtu: centre.studyCtu?.id,
        ctu: centre.ctu,
        pi: centre.pi,
        piNationalCoordinator: centre.piNationalCoordinator,
      }))
    });
    return formArray;
  }

  // TODO
  ngOnChanges(changes: SimpleChanges) {
    if (changes.centresData) {
      if (this.centresData === null) {
        this.centres = [];
      } else {
        this.centres = this.centresData;
      }
      this.patchForm();
    }
  }

  addCentre() {
    this.getCentresForm().push(this.newCentre());
  }

  removeCentre(i: number) {
    const removeModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
    removeModal.componentInstance.itemType = "centre";

    removeModal.result.then((remove) => {
      if (remove) {
        const cId = this.getCentresForm().value[i].id;
        if (!cId) { // Study CTU has been locally added only
          this.getCentresForm().removeAt(i);
        } else {  // Existing study CTU
          this.studyService.deleteCentreFromStudyCTU(this.studyCTU.id, cId).subscribe((res: any) => {
            if (res.status === 204) {
              this.getCentresForm().removeAt(i);
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

  // TODO: to common/util
  addPerson = (person) => {
    const addPersonModal = this.modalService.open(AddPersonModalComponent, { size: 'lg', backdrop: 'static' });
    addPersonModal.componentInstance.fullName = person;

    return addPersonModal.result.then((result) => {
      this.spinner.show();
      if (result === null) {
        return new Promise(null);
      }

      return this.contextService.addPerson(result).pipe(
        mergeMap((p:any) => {
          result.id = p.id;
          return this.contextService.updatePersons();
        }),
        mergeMap(() => {
          this.spinner.hide();
          return of(result);
        }),
        catchError((err) => {
          this.toastr.error(err, "Error adding person", { timeOut: 20000, extendedTimeOut: 20000 });
          this.spinner.hide();
          return of(null);
        })
      ).toPromise();
    })
    .catch((err) => {
      this.spinner.hide();
      this.toastr.error(err, "Error adding person", { timeOut: 20000, extendedTimeOut: 20000 });
      return null;
    });
  }

  // TODO: refactor spinner hide
  // TODO: to common/util
  deletePerson($event, pToRemove) {
    $event.stopPropagation(); // Clicks the option otherwise

    if (pToRemove.id == -1) {  // Created locally by user
      this.persons = this.persons.filter(s => !(s.id == pToRemove.id && s.fullName == pToRemove.fullName));
    } else {  // Already existing
      this.spinner.show();
      // Checking if other projects have this service
      this.listService.getProjectsByPerson(pToRemove.id).subscribe((res: []) => {
        // Allowing deletion on current project, even if person is selected in another field/component (too complicated otherwise)
        let resWithoutCurrent: ProjectInterface[] = res;
        if (!this.isAdd) {
          // TODO
          resWithoutCurrent = res.filter((project: ProjectInterface) => project.id != this.projectId);
        }

        if (resWithoutCurrent.length > 0) {
          this.toastr.error(`Failed to delete this person as it is used in project${(resWithoutCurrent.length > 1) ? 's' : ''}:\
           ${resWithoutCurrent.map(proj => proj.shortName).join(", ")}`, "Error deleting person", { timeOut: 20000, extendedTimeOut: 20000 });
           this.spinner.hide();
        } else {
          // Delete person from the DB, then locally if succeeded
          this.contextService.deletePerson(pToRemove.id).subscribe((res: any) => {
            if (res.status !== 204) {
              this.toastr.error('Error when deleting person', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
              this.spinner.hide();
            } else {
              // Updating persons list
              this.contextService.updatePersons().subscribe(() => {
                this.spinner.hide();
              });
            }
          }, error => {
            this.toastr.error(error);
            this.spinner.hide();
          });
        }
      }, error => {
        this.toastr.error(error);
        this.spinner.hide();
      });
    }
  }

  searchPersons(term: string, item) {
    term = term.toLocaleLowerCase();
    return item.fullName?.toLocaleLowerCase().indexOf(term) > -1 || item.email?.toLocaleLowerCase().indexOf(term) > -1;
  }

  formValid() {
    this.submitted = true;
    
    // Manually checking CTU field (shouldn't be empty)
    for (const i in this.form.get("centres")['controls']) {
      if (this.form.get("centres")['controls'][i].value.ctu == null) {
        this.form.get("centres")['controls'][i].controls.ctu.setErrors({'required': true});
      }
    }

    return this.form.valid;
  }

  updatePayload(payload, sctuId, studyId, i) {
    payload.studyCtu = sctuId;
    payload.study = studyId;

    if (payload.recruitmentGreenlight) {
      payload.recruitmentGreenlight = dateToString(payload.recruitmentGreenlight);
    }
    if (payload.firstPatientVisit) {
      payload.firstPatientVisit = dateToString(payload.firstPatientVisit);
    }

    if (payload.pi?.id) {
      payload.pi = payload.pi.id;
    }

    payload.order = i;
  }

  onSave(sctuId: string, studyId: string): Observable<boolean[]> {
    this.submitted = true;
    let saveObs$: Array<Observable<boolean>> = [];

    const payload = JSON.parse(JSON.stringify(this.form.value));
  
    for (const [i, item] of payload.centres.entries()) {
      this.updatePayload(item, sctuId, studyId, i);
      if (!item.id) { // Add
        saveObs$.push(this.studyService.addCentreFromStudyCTU(sctuId, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 201) {
              return of(true);
            }
            return of(false);
          })
        ));
      } else {  // Edit
        saveObs$.push(this.studyService.editCentreFromStudyCTU(sctuId, item.id, item).pipe(
          mergeMap((res: any) => {
            if (res.statusCode === 200) {
              return of(true);
            }
            return of(false);
          })
        ));
      }
    }

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
}
