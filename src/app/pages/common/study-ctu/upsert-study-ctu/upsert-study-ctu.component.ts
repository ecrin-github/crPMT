import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

import { ClassValueInterface } from 'src/app/_rms/interfaces/context/class-value.interface';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { CTUInterface } from 'src/app/_rms/interfaces/context/ctu.interface';
import { StudyCountryInterface } from 'src/app/_rms/interfaces/core/study-country.interface';
import { StudyCTUInterface } from 'src/app/_rms/interfaces/core/study-ctus.interface';

import { BackService } from 'src/app/_rms/services/back/back.service';
import { GraphApiService } from 'src/app/_rms/services/common/graph-api/graph-api.service';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { CtuContractingEntityService } from 'src/app/_rms/services/context/ctu-contracting-entity/ctu-contracting-entity.service';
import { StudyCtuService } from 'src/app/_rms/services/entities/study-ctu/study-ctu.service';
import { CtuMapperService } from 'src/app/_rms/services/entities/study-ctu/ctu-mapper.service';

import {
    dateToString,
    getFlagEmoji,
    getTagBgColor,
    getTagBorderColor,
    getYYYYMMDDFromDateString
} from 'src/assets/js/util';

import { UpsertCentreComponent } from '../../centre/upsert-centre/upsert-centre.component';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { UpsertCtuAgreementComponent } from '../../ctu-agreement/upsert-ctu-agreement/upsert-ctu-agreement.component';
import { CtuEvaluationResults, SasVerificationResults, ctuEvaluationsListUrl, sasTrackerListUrl } from 'src/assets/js/constants';
import { PersonInterface } from 'src/app/_rms/interfaces/context/person.interface';

@Component({
    selector: 'app-upsert-study-ctu',
    templateUrl: './upsert-study-ctu.component.html',
    styleUrls: ['./upsert-study-ctu.component.scss']
})
export class UpsertStudyCtuComponent implements OnInit {
    @ViewChildren('ctuAgreements') ctuAgreementComponents: QueryList<UpsertCtuAgreementComponent>;
    @ViewChildren('centres') centreComponents: QueryList<UpsertCentreComponent>;
    @Input() studyCTUsData: Array<StudyCTUInterface>;
    @Input() studyCountry: StudyCountryInterface;

    public ctuEvaluationsListUrl: string = ctuEvaluationsListUrl;
    static intPatternValidatorFn: ValidatorFn = Validators.pattern('^[0-9]*$');

    id: string;
    form: UntypedFormGroup;
    submitted = false;
    isEdit = false;
    isView = false;
    isAdd = false;
    isSctuPage = false;
    ctus: any[] = [];
    countries: CountryInterface[] = [];
    persons: PersonInterface[] = [];
    ctuContractingEntities: ClassValueInterface[] = [];
    services: ClassValueInterface[] = [];
    studyCTUs: StudyCTUInterface[] = [];
    ctuEvaluations: any[] = [];
    loadingCTUEvaluations: boolean = false;
    public sasTrackerListUrl: string = sasTrackerListUrl;
    sasVerifications: any[] = [];
    loadingSASVerifications: boolean = false;
    nonComplianceItems: any[] = [];
    nonComplianceLoading: boolean = false;
    nonComplianceError: string = '';

    constructor(
        private activatedRoute: ActivatedRoute,
        private backService: BackService,
        private fb: UntypedFormBuilder,
        private modalService: NgbModal,
        private router: Router,
        private contextService: ContextService,
        private ctuContractingEntityService: CtuContractingEntityService,
        private graphApi: GraphApiService,
        private spinner: NgxSpinnerService,
        private studyCTUService: StudyCtuService,
        private ctuMapperService: CtuMapperService,
        private toastr: ToastrService
    ) {
        this.form = this.fb.group({
            studyCTUs: this.fb.array([])
        });
    }

    ngOnInit(): void {
        this.initPageFlags();
        this.loadInitialStudyCtuIfNeeded();

        this.contextService.countries.subscribe((countries) => {
            this.countries = countries || [];

            // Need countries for CTUs
            if (this.countries != null && this.ctus?.length == 0) {
                this.loadCtus();
            }
        });
        this.loadCtus();
        this.subscribeToServices();
        this.subscribeToPersons();

        if (this.isView) {
            this.subscribeToNonComplianceRegister();
        }
    }

    private initPageFlags(): void {
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
    }

    private loadInitialStudyCtuIfNeeded(): void {
        const queryFuncs: Array<Observable<any>> = [];

        if (this.isSctuPage && !this.isAdd) {
            queryFuncs.push(this.getStudyCTU(this.id));
        }

        if (queryFuncs.length === 0) {
            setTimeout(() => {
                this.spinner.hide();
            });
            return;
        }

        const obsArr: Array<Observable<any>> = [];
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
    }

    private subscribeToPersons(): void {
        this.contextService.persons.subscribe((persons) => {
            this.persons = persons;
            if (this.persons) {
                this.persons = this.persons.filter(p => !p.isEuco);
            }
        });
    }

    private loadCtus(): void {
        combineLatest([this.contextService.ctus, this.graphApi.ctusServiceProviders$]).subscribe((res) => {
            const sharePointCtus = res.pop();
            const dbCtus = res.pop();

            let sharePointIds = new Set();
            this.ctus = [];

            if (sharePointCtus && sharePointCtus?.length > 0) {
                // Fix country ISO2 for SharePoint CTUs if they have ISO3 codes
                sharePointCtus.forEach(ctu => {
                    if (ctu.country?.iso2 && this.countries?.length > 0) {
                        const correctIso2 = this.ctuMapperService.findCountryIso2FromSharePoint(ctu, this.countries);
                        if (correctIso2 && correctIso2 !== ctu.country.iso2) {
                            ctu.country.iso2 = correctIso2;
                            const countryMatch = this.countries.find(c => c.iso2 === correctIso2);
                            if (countryMatch) {
                                ctu.country.name = countryMatch.name;
                            }
                        }
                    }
                });

                this.ctus = [...sharePointCtus];
                sharePointCtus.forEach((ctu) => sharePointIds.add(ctu.sharepointItemId));

                // TODO
                // Re-patch the form so existing DB CTUs can be replaced by
                // their SharePoint version when SharePoint data is available.
                if (this.studyCTUs?.length > 0) {

                }
            }

            // Add DB CTUs that have been manually added or all of them if the SharePoint query failed
            if (dbCtus && dbCtus?.length > 0) {
                dbCtus.forEach((ctu) => {
                    if (ctu.manualAdd || sharePointCtus?.length == 0) {
                        this.ctus.push(ctu);
                    }
                })
            }

            this.sortCTUs();
        });
    }

    private subscribeToNonComplianceRegister(): void {
        this.nonComplianceLoading = true;
        this.graphApi.nonComplianceRegister$.subscribe((items: any[]) => {
            if (items) {
                this.filterNonComplianceByProject(items);
            }
            this.nonComplianceLoading = false;
        }, (error) => {
            console.error('Error loading non-compliance register:', error);
            this.nonComplianceError = 'Unable to load SharePoint non-compliance register.';
            this.nonComplianceLoading = false;
        });
    }

    private filterNonComplianceByProject(allItems: any[]): void {
        if (!this.studyCTUs || this.studyCTUs.length === 0) {
            this.nonComplianceItems = [];
            return;
        }

        const currentStudy = this.studyCTUs[0]?.study;
        const currentProject = currentStudy?.project?.shortName;

        if (!currentProject) {
            this.nonComplianceItems = [];
            return;
        }

        const normalize = (str: string) => str?.toLowerCase().trim() || '';

        this.nonComplianceItems = allItems.filter(item => {
            const spProject = item.projectName;
            return normalize(spProject).includes(normalize(currentProject)) ||
                normalize(currentProject).includes(normalize(spProject));
        });
    }

    private subscribeToServices(): void {
        this.contextService.services.subscribe((services) => {
            this.services = services;
        });

        this.ctuContractingEntityService.ctuContractingEntities.subscribe((ctuContractingEntities) => {
            this.ctuContractingEntities = ctuContractingEntities;
        });
    }

    get g() { return this.form.get('studyCTUs')['controls']; }
    get fv() { return this.getStudyCTUsForm()?.value; }
    get fc() { return this.getStudyCTUsForm()?.controls; }

    getControls(i) {
        return this.g[i].controls;
    }

    getStudyCTUsForm(): UntypedFormArray {
        return this.form.get('studyCTUs') as UntypedFormArray;
    }

    newStudyCTU(): UntypedFormGroup {
        return this.fb.group({
            id: null,
            contactPerson: null,
            leadCtu: false,
            services: [],
            study: this.studyCountry?.study,
            studyCountry: this.studyCountry,
            ctu: [null, Validators.required],
            ctuContractingEntity: null,
            ctuAgreements: [],
            centres: null
        });
    }

    getStudyCTU(id) {
        return this.studyCTUService.getStudyCTU(id);
    }

    setStudyCTU(sctuData) {
        if (sctuData) {
            delete sctuData['statusCode'];
            this.studyCTUs = [sctuData];
            this.id = sctuData.id;
            this.patchForm();
        }
    }

    patchForm() {
        this.form.setControl('studyCTUs', this.patchArray());
        this.onChangeCTU();
    }

    patchArray(): UntypedFormArray {
        const formArray = new UntypedFormArray([]);
        this.studyCTUs.forEach((sctu) => {
            const mappedCtu = this.mapExistingCtuToDisplayedCtu(sctu.ctu);

            formArray.push(this.fb.group({
                id: sctu.id,
                contactPerson: sctu.contactPerson,
                leadCtu: sctu.leadCtu,
                services: [sctu.services],
                study: sctu.study,
                studyCountry: sctu.studyCountry,
                ctu: mappedCtu,
                ctuContractingEntity: sctu.ctuContractingEntity,
                ctuAgreements: [sctu.ctuAgreements],
                centres: [sctu.centres]
            }));
        });
        return formArray;
    }

    sortCTUs() {
        const countryISO2 =
            this.studyCountry?.country?.iso2 ||
            this.form.value.studyCTUs[0]?.studyCountry?.country?.iso2;

        if (!countryISO2 || !this.ctus?.length) {
            return;
        }

        const { compare } = Intl.Collator('en-GB');

        this.ctus.sort((a, b) => {
            if (a.country?.iso2?.localeCompare(countryISO2) === 0) {
                if (b.country?.iso2?.localeCompare(countryISO2) === 0) {
                    return compare((a.shortName || '') + (a.name || ''), (b.shortName || '') + (b.name || ''));
                }
                return -1;
            } else if (b.country?.iso2?.localeCompare(countryISO2) === 0) {
                return 1;
            } else {
                const countryCompare = (a.country?.name || 'ZZZ').localeCompare(b.country?.name || 'ZZZ');
                if (countryCompare > 0) {
                    return 1;
                } else if (countryCompare < 0) {
                    return -1;
                } else {
                    return compare((a.shortName || '') + (a.name || ''), (b.shortName || '') + (b.name || ''));
                }
            }
        });
    }

    cleanAddress(address) {
        if (!address) {
            return null;
        }
        return address.replace('\n', ' ');
    }

    toggleCTUInfo(event) {
        const ctuInfoElement = event.target.closest('.ctuPanel').getElementsByClassName('ctuInfo')[0];
        const expanded = ctuInfoElement.getAttribute('aria-expanded') === 'true';
        ctuInfoElement.setAttribute('aria-expanded', `${!expanded}`);

        if (expanded) {
            ctuInfoElement.classList.add('hideCTUInfo');
            ctuInfoElement.classList.remove('displayCTUInfo');

            event.target.classList.add('ctuToggleButtonClosed');
            event.target.classList.remove('ctuToggleButtonOpened');
        } else {
            ctuInfoElement.classList.add('displayCTUInfo');
            ctuInfoElement.classList.remove('hideCTUInfo');

            event.target.classList.add('ctuToggleButtonOpened');
            event.target.classList.remove('ctuToggleButtonClosed');
        }
    }

    getCountryFlag(iso2) {
        return getFlagEmoji(iso2);
    }

    onChangeCTU() {
        this.loadingCTUEvaluations = true;
        this.graphApi.ctuEvaluations$.subscribe((ctuEvaluations) => {
            for (const [i, fv] of this.fv.entries()) {
                const projectShortName = fv.study?.project?.shortName?.toLowerCase()?.trim();
                const ctuShortName = fv.ctu?.shortName?.toLowerCase()?.trim();

                if (projectShortName && ctuShortName && ctuEvaluations[projectShortName]) {
                    this.ctuEvaluations[i] = ctuEvaluations[projectShortName].filter(
                        (fields) => fields?.CTU?.toLowerCase() === ctuShortName
                    );
                } else {
                    this.ctuEvaluations[i] = [];
                }
            }
            this.sortCTUEvaluations();
            this.loadingCTUEvaluations = false;
        });
        this.loadingSASVerifications = true;
        this.graphApi.sasTracker$.subscribe((sasTracker: any) => {
            for (const [i, fv] of this.fv.entries()) {
                const ctuShortName = fv.ctu?.shortName?.toLowerCase()?.trim();
                const ctuTitle = fv.ctu?.name?.toLowerCase()?.trim();

                if (ctuShortName && sasTracker[ctuShortName]) {
                    this.sasVerifications[i] = sasTracker[ctuShortName];
                } else if (ctuTitle && sasTracker[ctuTitle]) {
                    this.sasVerifications[i] = sasTracker[ctuTitle];
                } else {
                    this.sasVerifications[i] = [];
                }
            }

            this.loadingSASVerifications = false;
        });
    }

    getSASVerificationResult(i): string | null {
        if (this.sasVerifications[i]?.length > 0) {
            const rawStatus = this.sasVerifications[i][0]?.Status;
            // Defensive: SharePoint can return this field as something other than a plain string
            const status = typeof rawStatus === 'string' ? rawStatus.toLowerCase().trim() : null;

            if (status === 'approved') {
                return SasVerificationResults.APPROVED;
            }

            return SasVerificationResults.NOT_APPROVED;
        } else if (this.loadingSASVerifications) {
            return 'Loading...';
        }

        return null;
    }
    getSASVerificationTagClass(i): string {
        const result = this.getSASVerificationResult(i)?.toLowerCase()?.trim();

        if (result === SasVerificationResults.APPROVED.toLowerCase()) {
            return 'tag-success';
        } else if (result === SasVerificationResults.NOT_APPROVED.toLowerCase()) {
            return 'tag-danger';
        }

        return '';
    }

    sortCTUEvaluations() {
        this.ctuEvaluations.sort((a, b) =>
            (a.Created > b.Created) ? 1 : ((b.Created > a.Created) ? -1 : 0)
        );
    }

    getCTUEvaluationResult(i) {
        if (this.ctuEvaluations[i]?.length > 0) {
            return this.ctuEvaluations[i][0]?.Result;
        } else if (this.loadingCTUEvaluations) {
            return 'Loading...';
        }
        return null;
    }

    getCTUEvaluationDate(i) {
        if (this.ctuEvaluations[i]?.length > 0) {
            return `(${getYYYYMMDDFromDateString(this.ctuEvaluations[i][0]?.Created)})`;
        } else if (this.loadingCTUEvaluations) {
            return 'Loading...';
        }
        return '';
    }

    getCTUEvaluationTagClass(i) {
        let tagClass = '';
        const resultText = this.getCTUEvaluationResult(i)?.toLowerCase().trim();

        if (resultText) {
            if (resultText === CtuEvaluationResults.SATISFACTORY?.toLowerCase()) {
                tagClass = 'tag-success';
            } else if (resultText === CtuEvaluationResults.NEEDS_IMPROVEMENT?.toLowerCase()) {
                tagClass = 'tag-warning';
            } else if (resultText === CtuEvaluationResults.UNSATISFACTORY?.toLowerCase()) {
                tagClass = 'tag-danger';
            }
        }
        return tagClass;
    }

    getCTUEvaluationTagBorderColor(i) {
        return getTagBorderColor(this.getCTUEvaluationResult(i));
    }

    getCTUEvaluationTagBgColor(i) {
        return getTagBgColor(this.getCTUEvaluationResult(i));
    }

    getTagBorderColor(text) {
        return getTagBorderColor(text);
    }

    getTagBgColor(text) {
        return getTagBgColor(text);
    }

    // Necessary to write them as arrow functions
    searchPersons = (term: string, item) => {
        return this.contextService.searchPersons(term, item);
    }

    addPerson = (personName: string) => {
        const country =
            this.studyCountry?.country ||
            this.form.value.studyCTUs[0]?.studyCountry?.country;
        console.log(country);
        return this.contextService.addPersonDropdown({ "fullName": personName, "country": country }, true, false);
    }

    deletePerson($event, pToRemove) {
        $event.stopPropagation(); // Clicks the option otherwise

        if (pToRemove.id == -1) {  // Created locally by user
            this.persons = this.persons.filter(s => !(s.id == pToRemove.id && s.fullName == pToRemove.fullName));
        } else {  // Already existing
            this.contextService.deletePersonDropdown(pToRemove, !this.isAdd);
        }
    }

    searchClassValues = (term: string, item) => {
        return this.contextService.searchClassValues(term, item);
    }

    addService = (value) => {
        return this.contextService.addServiceDropdown(value);
    }

    deleteService($event, sToRemove) {
        $event.stopPropagation();

        if (sToRemove.id == -1) {
            this.services = this.services.filter(s => !(s.id == sToRemove.id && s.value == sToRemove.value));
        } else {
            this.contextService.deleteServiceDropdown(sToRemove, !this.isAdd);
        }
    }

    // No addCtuContractingEntity: the list is fixed for now (see context/migrations/0026_seed_ctu_contracting_entities.py)
    ngOnChanges(changes: SimpleChanges) {
        let patchForm = false;

        if (changes.studyCountry?.previousValue?.country?.iso2 != changes.studyCountry?.currentValue?.country?.iso2) {
            if (this.ctus?.length > 0) {
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
        $event.stopPropagation();

        const sctuId = this.getStudyCTUsForm().value[i].id;
        if (!sctuId) {
            this.getStudyCTUsForm().removeAt(i);
        } else {
            const removeModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
            removeModal.componentInstance.setDefaultDeleteMessage('study CTU');

            removeModal.result.then((remove) => {
                if (remove) {
                    this.studyCTUService.deleteStudyCTU(sctuId).subscribe((res: any) => {
                        if (res.status === 204) {
                            this.getStudyCTUsForm().removeAt(i);
                            this.studyCTUs = this.studyCTUs.filter((item: any) => item.id != sctuId);
                            this.toastr.success('Study CTU deleted successfully');
                        } else {
                            this.toastr.error('Error when deleting study CTU', res.statusText);
                        }
                    }, error => {
                        this.toastr.error(error);
                    });
                }
            }, error => { this.toastr.error(error); });
        }
    }

    isFormValid() {
        this.submitted = true;

        for (const i in this.form.get('studyCTUs')['controls']) {
            if (this.form.get('studyCTUs')['controls'][i].value.ctu == null) {
                this.form.get('studyCTUs')['controls'][i].controls.ctu.setErrors({ required: true });
            }
        }

        if (!this.form.valid) {
            this.toastr.error('Please correct the errors in the study CTUs form');
        }

        return this.form.valid
            && !this.centreComponents.some(b => !b.isFormValid())
            && !this.ctuAgreementComponents.some(b => !b.isFormValid());
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

        if (payload.contactPerson?.id) {
            payload.contactPerson = payload.contactPerson.id;
        }

        if (payload.ctuContractingEntity?.id) {
            payload.ctuContractingEntity = payload.ctuContractingEntity.id;
        }

        if (payload.pi?.id) {
            payload.pi = payload.pi.id;
        }

        if (payload.services?.length > 0) {
            for (let j = 0; j < payload.services.length; j++) {
                if (payload.services[j]?.id) {
                    payload.services[j] = payload.services[j].id;
                }
            }
        } else {
            payload.services = [];
        }

        if (!this.isSctuPage) {
            payload.order = i;
        }
    }

    onSave(scId: string, studyId: string): Observable<boolean[]> {
        this.submitted = true;
        const saveObs$: Array<Observable<boolean>> = [];
        const payload = JSON.parse(JSON.stringify(this.form.value));

        for (const [i, item] of payload.studyCTUs.entries()) {
            let itemObs$: Observable<Object>;

            this.updatePayload(item, scId, studyId, i);

            if (!item.id) {
                itemObs$ = this.studyCTUService.addStudyCTUFromStudy(studyId, item);
            } else {
                itemObs$ = this.studyCTUService.editStudyCTU(item.id, item);
            }

            saveObs$.push(itemObs$.pipe(
                mergeMap((res: any) => {
                    if ((!item.id && res.statusCode === 201) || (item.id && res.statusCode === 200)) {
                        const subObs$: Observable<boolean>[] = [];

                        subObs$.push(
                            this.centreComponents.get(i).onSave(res.id, studyId).pipe(
                                map((successArr: boolean[]) => successArr.every(a => a))
                            )
                        );

                        subObs$.push(
                            this.ctuAgreementComponents.get(i).onSave(res.id).pipe(
                                map((successArr: boolean[]) => successArr.every(a => a))
                            )
                        );

                        return combineLatest(subObs$).pipe(
                            map((successArr: boolean[]) => successArr.every(a => a))
                        );
                    }

                    this.toastr.error('Failed to save Study CTU');
                    return of(false);
                }),
                catchError((err) => {
                    this.toastr.error(err);
                    return of(false);
                })
            ));
        }

        const formIds: Array<String> = payload.studyCTUs.map((item: StudyCTUInterface) => item.id);
        const removedItems: Array<StudyCTUInterface> = this.studyCTUs.filter(
            (previousItem: StudyCTUInterface) => formIds.indexOf(previousItem.id) < 0
        );

        removedItems.forEach((sctu: StudyCTUInterface) => {
            saveObs$.push(
                this.studyCTUService.deleteStudyCTU(sctu.id).pipe(
                    mergeMap((res: any) => {
                        if (res.status === 204) {
                            return of(true);
                        } else {
                            this.toastr.error(res);
                            return of(false);
                        }
                    }),
                    catchError(err => {
                        this.toastr.error(err);
                        return of(false);
                    })
                )
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
                    if (success.every(s => s)) { // success is a boolean[]: a non-empty array is always truthy on its own
                        this.toastr.success("Changes saved successfully");
                        this.router.navigate([`/study-ctus/${this.id}/view`]);
                    } else {
                        this.toastr.error("One or more items failed to save");
                    }
                });
            } else {
                this.spinner.hide();
                this.toastr.error("Couldn't get study and/or study country ID from study CTU");
            }
        } else {
            this.spinner.hide(); // Prevent infinite spinner when the form is invalid
        }
    }

    private mapExistingCtuToDisplayedCtu(ctu: any): any {
        if (!ctu) {
            return ctu;
        }

        const sharePointMatch = this.ctuMapperService.mapExistingCtuToDisplayedCtu(ctu, this.ctus, this.countries);

        const returned = (sharePointMatch && (sharePointMatch?.sharepointItemId || sharePointMatch?.source === 'sharepoint')) ? sharePointMatch : ctu;

        return returned;
    }

    dateToString(date) {
        return dateToString(date);
    }

    compareIds(fv1, fv2): boolean {
        return fv1?.id == fv2?.id;
    }

    compareCtuOptions = (a: any, b: any): boolean => {
        return this.ctuMapperService.compareCtuOptions(a, b, this.countries);
    };

    searchCTUs = (term: string, item: any) => {
        return this.ctuMapperService.searchCTUs(term, item);
    };

    back(): void {
        this.backService.back();
    }
}