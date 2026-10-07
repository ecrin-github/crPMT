import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { HospitalInterface } from 'src/app/_rms/interfaces/context/hospital.interface';
import { PersonInterface } from 'src/app/_rms/interfaces/context/person.interface';
import { CentreInterface } from 'src/app/_rms/interfaces/core/centre.interface';
import { StudyCTUInterface } from 'src/app/_rms/interfaces/core/study-ctus.interface';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { CentreService } from 'src/app/_rms/services/entities/centre/centre.service';
import { VisitTypeCodes } from 'src/assets/js/constants';
import { dateToString, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { UpsertVisitComponent } from '../../visit/upsert-visit/upsert-visit.component';
import { VisitService } from 'src/app/_rms/services/entities/visit/visit.service';

@Component({
    selector: 'app-upsert-centre',
    templateUrl: './upsert-centre.component.html',
    styleUrls: ['./upsert-centre.component.scss']
})
export class UpsertCentreComponent implements OnInit {
    VisitTypeCodes = VisitTypeCodes;

    @ViewChildren("siv") sivComponent: QueryList<UpsertVisitComponent>;
    @ViewChildren("mov") movComponent: QueryList<UpsertVisitComponent>;
    @ViewChildren("cov") covComponent: QueryList<UpsertVisitComponent>;
    @Input() centresData: Array<CentreInterface>;
    @Input() studyCTU: StudyCTUInterface;

    static intPatternValidatorFn: ValidatorFn = Validators.pattern("^[0-9]*$");

    form: UntypedFormGroup;
    submitted: boolean = false;
    isEdit: boolean = false;
    isView: boolean = false;
    isAdd: boolean = false;
    persons: PersonInterface[] = [];
    hospitals: HospitalInterface[] = [];
    filteredHospitals: HospitalInterface[] = [];
    hasSiteNumber: boolean[] = [];

    centres: CentreInterface[] = [];

    constructor(
        private fb: UntypedFormBuilder,
        private modalService: NgbModal,
        private router: Router,
        private contextService: ContextService,
        private centreService: CentreService,
        private visitService: VisitService,
        private toastr: ToastrService) {
        this.form = this.fb.group({
            centres: this.fb.array([])
        });
    }

    ngOnInit(): void {
        this.isEdit = this.router.url.includes('edit');
        this.isView = this.router.url.includes('view');
        this.isAdd = this.router.url.includes('add');

        this.contextService.hospitals.subscribe((hospitals) => {
            this.hospitals = hospitals;
            this.setFilteredHospitals();
        });

        this.contextService.persons.subscribe((persons) => {
            this.persons = persons;
            if (this.persons) {
                this.persons = this.persons.filter(p => !p.isEuco);
            }
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
            hospital: [null, Validators.required],
            siteNumberFlag: false,
            siteNumber: null,
            pi: null,
            piNationalCoordinator: false,
            patientsExpected: [null, [UpsertCentreComponent.intPatternValidatorFn]],
            competitiveEnrollment: false,
            recruitmentGreenlight: null,
            firstPatientVisit: null,
            movExpectedNumber: [null, [UpsertCentreComponent.intPatternValidatorFn]],
            siv: [[]],
            mov: [[]],
            cov: [[]],
            studyCtu: null,
            study: null,
            ctu: null,
        });
    }

    patchForm() {
        this.form.setControl('centres', this.getFormArray());

        // Setting initial boolean variables to display or not certain fields
        for (let i = 0; i < this.g.length; i++) {
            this.onChangeSiteNumber(i);
        }
    }

    // TODO: separate visits
    getFormArray(): UntypedFormArray {
        const formArray = new UntypedFormArray([]);
        this.centres.forEach((centre: CentreInterface) => {
            const fbData = {
                id: centre.id,
                hospital: [centre.hospital, Validators.required],
                siteNumberFlag: centre.siteNumberFlag,
                siteNumber: centre.siteNumber,
                pi: centre.pi,
                piNationalCoordinator: centre.piNationalCoordinator,
                patientsExpected: [centre.patientsExpected, [UpsertCentreComponent.intPatternValidatorFn]],
                competitiveEnrollment: centre.competitiveEnrollment,
                recruitmentGreenlight: centre.recruitmentGreenlight ? stringToDate(centre.recruitmentGreenlight) : null,
                firstPatientVisit: centre.firstPatientVisit ? stringToDate(centre.firstPatientVisit) : null,
                movExpectedNumber: [centre.movExpectedNumber, [UpsertCentreComponent.intPatternValidatorFn]],
                siv: [[]],
                mov: [[]],
                cov: [[]],
                studyCtu: centre.studyCtu?.id,
                study: centre.study?.id,
            };

            // Separating visits in the FE
            if (centre.visits) {
                for (const v of centre.visits) {
                    if (v.visitType === VisitTypeCodes.SIV) {
                        fbData.siv[0].push(v);
                    } else if (v.visitType === VisitTypeCodes.MOV) {
                        fbData.mov[0].push(v);
                    } else if (v.visitType === VisitTypeCodes.COV) {
                        fbData.cov[0].push(v);
                    } else {
                        this.toastr.error(`Unknown visit type ${v.visitType}`);
                    }
                }
            }

            formArray.push(this.fb.group(fbData));
        });

        return formArray;
    }

    // TODO
    ngOnChanges(changes: SimpleChanges) {
        if (changes.centresData) {
            if (!this.centresData) {
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
        const cId = this.getCentresForm().value[i].id;
        if (!cId) { // Centre has been locally added only
            this.getCentresForm().removeAt(i);
        } else {  // Existing centre
            const removeModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
            removeModal.componentInstance.setDefaultDeleteMessage("centre");

            removeModal.result.then((remove) => {
                if (remove) {
                    this.centreService.deleteCentre(cId).subscribe((res: any) => {
                        if (res.status === 204) {
                            this.getCentresForm().removeAt(i);
                            this.toastr.success('Centre deleted successfully');
                        } else {
                            this.toastr.error('Error when deleting centre', res.statusText);
                        }
                    }, error => {
                        this.toastr.error(error);
                    });
                }
            }, error => { this.toastr.error(error) });
        }
    }

    addPerson = (personName: string) => {
        return this.contextService.addPersonDropdown({ "fullName": personName, "country": this.studyCTU?.studyCountry?.country }, true, false);
    }

    deletePerson($event, pToRemove) {
        $event.stopPropagation(); // Clicks the option otherwise

        if (pToRemove.id == -1) {  // Created locally by user
            this.persons = this.persons.filter(s => !(s.id == pToRemove.id && s.fullName == pToRemove.fullName));
        } else {  // Already existing
            this.contextService.deletePersonDropdown(pToRemove, !this.isAdd);
        }
    }

    searchPersons = (term: string, item) => {
        return this.contextService.searchPersons(term, item);
    }

    // Necessary to write them as arrow functions
    addHospital = (hospitalName) => {
        return this.contextService.addHospitalDropdown(hospitalName, this.studyCTU?.studyCountry?.country);
    }

    deleteHospital($event, oToRemove) {
        $event.stopPropagation(); // Clicks the option otherwise

        if (oToRemove.id == -1) { // Created locally by user
            this.hospitals = this.hospitals.filter(o => !(o.id == oToRemove.id && o.name == oToRemove.name));
        } else {  // Already existing
            this.contextService.deleteHospitalDropdown(oToRemove, !this.isAdd);
        }
    }

    searchHospitals = (term: string, item) => {
        return this.contextService.searchHospitals(term, item);
    }

    setFilteredHospitals() {
        if (this.hospitals) {
            this.filteredHospitals = this.hospitals.filter(h => h.country?.iso2?.localeCompare(this.studyCTU?.studyCountry?.country?.iso2) == 0);
        }
    }

    onChangeSiteNumber(i) {
        if (this.form.get("centres")['controls'][i].value?.siteNumberFlag) {
            this.hasSiteNumber[i] = true;
        } else {
            this.hasSiteNumber[i] = false;
        }
    }

    isFormValid() {
        this.submitted = true;

        // Manually checking hospital field (shouldn't be empty)
        for (const i in this.form.get("centres")['controls']) {
            if (this.form.get("centres")['controls'][i].value.hospital == null) {
                this.form.get("centres")['controls'][i].controls.hospital.setErrors({ 'required': true });
            }
        }

        if (!this.form.valid) {
            this.toastr.error("Please correct the errors in the centres form");
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

        if (payload.hospital?.id) {
            payload.hospital = payload.hospital.id;
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

            let centreObs$: Observable<Object> = null;
            if (!item.id) { // Add
                centreObs$ = this.centreService.addCentreFromStudyCTU(sctuId, item);
            } else {
                centreObs$ = this.centreService.editCentre(item.id, item);
            }

            saveObs$.push(centreObs$.pipe(
                mergeMap((res: any) => {
                    if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
                        const cId = res.id;

                        let subObs$: Observable<Boolean>[] = [];
                        const addPayload = [];
                        const editPayload = [];

                        const sivPayload = JSON.parse(JSON.stringify(this.sivComponent.get(i).form.value));
                        const movPayload = JSON.parse(JSON.stringify(this.movComponent.get(i).form.value));
                        const covPayload = JSON.parse(JSON.stringify(this.covComponent.get(i).form.value));

                        for (const [i, item] of sivPayload.visits.entries()) {
                            this.sivComponent.get(i).updatePayload(item, cId, i);

                            if (!item.id) {
                                addPayload.push(item);
                            } else {
                                editPayload.push(item);
                            }
                        }

                        for (const [i, item] of movPayload.visits.entries()) {
                            this.movComponent.get(i).updatePayload(item, cId, i);

                            if (!item.id) {
                                addPayload.push(item);
                            } else {
                                editPayload.push(item);
                            }
                        }

                        for (const [i, item] of covPayload.visits.entries()) {
                            this.covComponent.get(i).updatePayload(item, cId, i);

                            if (!item.id) {
                                addPayload.push(item);
                            } else {
                                editPayload.push(item);
                            }
                        }

                        // Bulk add queries
                        if (addPayload.length > 0) {
                            subObs$.push(this.visitService.addVisits(addPayload).pipe(
                                mergeMap((res: any) => {
                                    if (res.status === 201) {
                                        return of(true);
                                    }
                                    return of(false);
                                })
                            ));
                        }

                        // Bulk edit queries
                        if (editPayload.length > 0) {
                            subObs$.push(this.visitService.editVisits(editPayload).pipe(
                                mergeMap((res: any) => {
                                    if (res.status === 200) {
                                        return of(true);
                                    }
                                    return of(false);
                                })
                            ));
                        }

                        /* Deleted visits queries */
                        subObs$.push(this.sivComponent.get(i).getDeletedVisits$().pipe(
                            mergeMap((successArr: Boolean[]) => {
                                const success: boolean = successArr.every(b => b);
                                return of(success);
                            })
                        ));

                        subObs$.push(this.movComponent.get(i).getDeletedVisits$().pipe(
                            mergeMap((successArr: Boolean[]) => {
                                const success: boolean = successArr.every(b => b);
                                return of(success);
                            })
                        ));

                        subObs$.push(this.covComponent.get(i).getDeletedVisits$().pipe(
                            mergeMap((successArr: Boolean[]) => {
                                const success: boolean = successArr.every(b => b);
                                return of(success);
                            })
                        ));

                        if (subObs$.length == 0) {
                            subObs$.push(of(true));
                        }

                        return combineLatest(subObs$).pipe(
                            mergeMap((successArr: Boolean[]) => {
                                const success: boolean = successArr.every(b => b);
                                return of(success);
                            })
                        );
                    }
                    return of(false);
                })
            ));
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
