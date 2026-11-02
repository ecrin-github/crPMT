import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, forkJoin, of } from 'rxjs';
import { catchError, map, mapTo, mergeMap } from 'rxjs/operators';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';
import { SafetyNotificationFormsInterface, SafetyNotificationInterface } from 'src/app/_rms/interfaces/core/safety-notification.interface';
import { StudyCountryInterface } from 'src/app/_rms/interfaces/core/study-country.interface';
import { StudyInterface } from 'src/app/_rms/interfaces/core/study.interface';
import { BackService } from 'src/app/_rms/services/back/back.service';
import { UnsavedChangesService } from 'src/app/_rms/services/unsaved-changes/unsaved-changes.service';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { SafetyNotificationService } from 'src/app/_rms/services/entities/safety-notification/safety-notification.service';
import { StudyCountryService } from 'src/app/_rms/services/entities/study-country/study-country.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { dateToString, getFlagEmoji, getTagBgColor, getTagBorderColor, stringToDate } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { UpsertNotificationComponent } from '../../notification/upsert-notification/upsert-notification.component';
import { UpsertSafetyNotificationComponent } from '../../safety-notification/upsert-safety-notification/upsert-safety-notification.component';
import { UpsertStudyCtuComponent } from '../../study-ctu/upsert-study-ctu/upsert-study-ctu.component';
import { UpsertSubmissionComponent } from '../../submission/upsert-submission/upsert-submission.component';
import { AuthorityCodes, SafetyNotificationTypeCodes, CA_TEXT, EC_TEXT } from 'src/assets/js/constants';
import { RegulatoryLinkService } from 'src/app/_rms/services/common/regulatory-link/regulatory-link.service';

@Component({
    selector: 'app-upsert-study-country',
    templateUrl: './upsert-study-country.component.html',
    styleUrls: ['./upsert-study-country.component.scss']
})
export class UpsertStudyCountryComponent implements OnInit {
    SafetyNotificationTypeCodes = SafetyNotificationTypeCodes;
    AuthorityCodes = AuthorityCodes;

    @ViewChildren('studyCTUs') studyCTUComponents: QueryList<UpsertStudyCtuComponent>;
    @ViewChildren('regulatorySubmissions') submissionsComponents: QueryList<UpsertSubmissionComponent>;
    @ViewChildren('amendments') amendmentsComponents: QueryList<UpsertSubmissionComponent>;
    @ViewChildren('safetyNotificationsAnnualEC') safetyNotificationsAnnualEC: QueryList<UpsertSafetyNotificationComponent>;
    @ViewChildren('safetyNotificationsAnnualCA') safetyNotificationsAnnualCA: QueryList<UpsertSafetyNotificationComponent>;
    @ViewChildren('safetyNotificationsDsurEC') safetyNotificationsDsurEC: QueryList<UpsertSafetyNotificationComponent>;
    @ViewChildren('safetyNotificationsDsurCA') safetyNotificationsDsurCA: QueryList<UpsertSafetyNotificationComponent>;
    @ViewChildren('otherNotifications') otherNotificationsComponents: QueryList<UpsertSubmissionComponent>;
    @ViewChildren('notifications') notificationsComponents: QueryList<UpsertNotificationComponent>;
    @Input() studyCountriesData: Array<StudyCountryInterface>;
    @Input() study: StudyInterface;

    id: string;
    form: UntypedFormGroup;
    arrLength = 0;
    hovered: boolean = false;
    len: any;
    submitted: boolean = false;
    isAdd: boolean = false;
    isEdit: boolean = false;
    isView: boolean = false;
    isSCPage: boolean = false;
    studyUsesCtisForSNs: boolean = false;
    countryWhereCtisFlagChecked: CountryInterface = null;
    studyUsesCtisForSNsChanged: boolean = false;  // Used to track changes to the ctis check, to link/unlink SNs accordingly
    countries: CountryInterface[] = [];
    studyCountries = [];
    snForms: SafetyNotificationFormsInterface[] = [];
    snFormSharedIndex: number = -1;

    constructor(
        private fb: UntypedFormBuilder,
        private modalService: NgbModal,
        private router: Router,
        private safetyNotificationService: SafetyNotificationService,
        private studyService: StudyService,
        private studyCountryService: StudyCountryService,
        private activatedRoute: ActivatedRoute,
        private spinner: NgxSpinnerService,
        public contextService: ContextService,
        private backService: BackService,
        private regulatoryLinkService: RegulatoryLinkService,
        private toastr: ToastrService,
        private unsavedChangesService: UnsavedChangesService) {
        this.form = this.fb.group({
            studyCountries: this.fb.array([])
        });
    }

    ngOnInit(): void {
        if (this.router.url.includes('study-countries')) {
            this.id = this.activatedRoute.snapshot.params.id;
            this.isSCPage = true;
        }

        if (this.isSCPage) {
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
        if (this.isSCPage && !this.isAdd) {
            queryFuncs.push(this.getStudyCountry(this.id));
        }

        let obsArr: Array<Observable<any>> = [];
        queryFuncs.forEach((funct) => {
            obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error)))));
        });

        combineLatest(obsArr).subscribe(res => {
            if (this.isSCPage && !this.isAdd) {
                this.setStudyCountry(res.pop());
            }

            setTimeout(() => {
                this.spinner.hide();
            });
        });

        this.contextService.countries.subscribe((countries) => {
            this.countries = countries;
        });
    }

    get g() { return this.form.get('studyCountries')["controls"]; }

    getControls(i) {
        return this.form.get('studyCountries')["controls"][i].controls;
    }

    getStudyCountriesForm(): UntypedFormArray {
        return this.form.get('studyCountries') as UntypedFormArray;
    }

    newStudyCountry(): UntypedFormGroup {
        return this.fb.group({
            id: null,
            amendments: [[]],
            country: [null, Validators.required],
            notifications: [[]],
            otherNotifications: [[]],
            safetyNotifications: [[]],  // Used when saving
            submissions: [[]],
            snAnnualEcNa: false,
            snAnnualCaNa: false,
            snDsurEcNa: false,
            snDsurCaNa: false,
            study: this.study,
            studyCtus: null
        });
    }

    getStudyCountry(id) {
        return this.studyCountryService.getStudyCountry(id);
    }

    setStudyCountry(scData) {
        if (scData) {
            delete scData["statusCode"];
            this.studyCountries = [scData];
            this.id = scData.id;
            this.patchForm();
        }
    }

    patchForm() {
        this.form.setControl('studyCountries', this.patchArray());

        // Initialize regulatory links for each study country
        this.studyCountries.forEach((sc, index) => {
            const submissions = sc.submissions?.filter(sub => !sub.isAmendment && !sub.isOtherNotification) || [];
            const notifications = sc.notifications || [];
            this.regulatoryLinkService.initializeFromData(sc.id, submissions, notifications);
        });
    }

    patchArray(): UntypedFormArray {
        const formArray = new UntypedFormArray([]);
        this.studyCountries.forEach((sc, index) => {
            let fbData = {
                id: sc.id,
                amendments: [[]],
                country: [sc.country, [Validators.required]],
                notifications: [sc.notifications],
                otherNotifications: [[]],
                safetyNotifications: [[]],  // Used when saving
                submissions: [[]],
                snAnnualEcNa: sc.snAnnualEcNa,
                snAnnualCaNa: sc.snAnnualCaNa,
                snDsurEcNa: sc.snDsurEcNa,
                snDsurCaNa: sc.snDsurCaNa,
                study: sc.study,
                studyCtus: [sc.studyCtus]
            };

            // Setting global CTIS flag (for single sc or project/study editing)
            this.studyUsesCtisForSNs = sc.study?.usesCtisForSafetyNotifications;

            // Note: first ctis-SC in order (even if there are multiple SCs) will be the one where CTIS flag is checked and thus where SNs are editable
            if (this.studyUsesCtisForSNs && !this.countryWhereCtisFlagChecked && this.contextService.isCtisCountry(sc.country)) {
                this.countryWhereCtisFlagChecked = sc.country;
            }

            // Separating initial submissions, amendments, and other notifications in the UI
            if (sc.submissions) {
                for (const sub of sc.submissions) {
                    if (sub.isAmendment) {
                        fbData.amendments[0].push(sub);
                    } else if (sub.isOtherNotification) {
                        fbData.otherNotifications[0].push(sub);
                    } else {
                        fbData.submissions[0].push(sub);
                    }
                }
            }

            const sns = this.getSeparatedSNs(sc);

            this.createSnForms(sc, index, sns.snsAnnualCa, sns.snsAnnualEc, sns.snsDsurCa, sns.snsDsurEc);

            formArray.push(this.fb.group(fbData));
        });

        return formArray;
    }

    getSeparatedSNs(sc) {
        // TODO: this should be a separate class
        let sns = {
            snsAnnualEc: [],
            snsAnnualCa: [],
            snsDsurEc: [],
            snsDsurCa: [],
        }

        // Separating safety notifications by type + authority in the UI
        if (sc.safetyNotifications) {
            for (const sn of sc.safetyNotifications) {
                const authorityCode = sn.authority?.code ? sn.authority.code : sn.authority;
                const typeCode = sn.notificationType?.code ? sn.notificationType.code : sn.notificationType;
                if (typeCode === SafetyNotificationTypeCodes.AnnualProgressReport) {
                    if (authorityCode === AuthorityCodes.EC) {
                        sns.snsAnnualEc.push(sn);
                    } else if (authorityCode === AuthorityCodes.CA) {
                        sns.snsAnnualCa.push(sn);
                    } else {
                        console.log(authorityCode);
                        this.toastr.error("No annual progress report notification authority found");
                    }
                } else if (typeCode === SafetyNotificationTypeCodes.DSUR) {
                    if (authorityCode === AuthorityCodes.EC) {
                        sns.snsDsurEc.push(sn);
                    } else if (authorityCode === AuthorityCodes.CA) {
                        sns.snsDsurCa.push(sn);
                    } else {
                        this.toastr.error("No DSUR notification authority found");
                    }
                } else {
                    this.toastr.error("No safety notification type found");
                }
            }
        }

        return sns;
    }

    createSnForms(
        sc: StudyCountryInterface,
        i: number,
        snsAnnualCa: SafetyNotificationInterface[],
        snsAnnualEc: SafetyNotificationInterface[],
        snsDsurCa: SafetyNotificationInterface[],
        snsDsurEc: SafetyNotificationInterface[]) {

        if (this.snFormSharedIndex > -1 && this.contextService.isCtisCountry(sc.country)) {  // Use shared SN forms for CTIS SCs
            this.setSharedSnForms(i);
        } else {  // Create the SN forms
            this.setSnForms(
                i,
                this.createSnForm(snsAnnualEc),
                this.createSnForm(snsAnnualCa),
                this.createSnForm(snsDsurEc),
                this.createSnForm(snsDsurCa)
            );

            if (this.studyUsesCtisForSNs && this.countryWhereCtisFlagChecked === sc.country) {
                this.snFormSharedIndex = i;
            }
        }
    }

    createSnForm(snData) {
        // TODO: should get method from SafetyNotification component?
        let form = this.createEmptySnForm();

        const formArray = new UntypedFormArray([]);
        snData.forEach((sn, index) => {
            formArray.push(this.fb.group({
                id: sn.id,
                authority: sn.authority,
                submissionDate: sn.submissionDate ? stringToDate(sn.submissionDate) : null,
                year: sn.year,
                notApplicable: sn.notApplicable,
                notificationType: sn.notificationType?.code ? sn.notificationType.code : sn.notificationType,
            }));
        });

        form.setControl('safetyNotifications', formArray);

        return form;
    }

    createEmptySnForm() {
        return this.fb.group({
            safetyNotifications: this.fb.array([])
        });
    }

    setSnForms(i, snAnnualEcForm, snAnnualCaForm, snDsurEcForm, snDsurCaForm) {
        // TODO: this should be a separate class
        this.snForms[i] = {
            snAnnualEcForm: snAnnualEcForm,
            snAnnualCaForm: snAnnualCaForm,
            snDsurEcForm: snDsurEcForm,
            snDsurCaForm: snDsurCaForm,
        };
    }

    setEmptySnForms(i) {
        this.setSnForms(i, this.createEmptySnForm(), this.createEmptySnForm(), this.createEmptySnForm(), this.createEmptySnForm());
    }

    setSharedSnForms(i) {
        this.setSnForms(
            i,
            this.snForms[this.snFormSharedIndex].snAnnualEcForm,
            this.snForms[this.snFormSharedIndex].snAnnualCaForm,
            this.snForms[this.snFormSharedIndex].snDsurEcForm,
            this.snForms[this.snFormSharedIndex].snDsurCaForm
        );
    }

    emptySnForm(snForm) {
        snForm.setControl('safetyNotifications', new UntypedFormArray([]));
    }

    // Note: doesn't trigger on SC page as country cannot be changed from there
    onChangeCountry(i) {
        let existingSC = null;

        // Attempting to find a "cached/soft deleted" SC on country change
        for (const sc of this.studyCountries) {
            if (sc?.country?.iso2 === this.g[i].value?.country?.iso2) {
                existingSC = sc;
                break;
            }
        }

        if (existingSC) { // Existing SC found, patching form
            delete existingSC["order"];

            // Separating initial submissions, amendments, and other notifications in the UI
            // TODO: refactor this, same code as when setting all SCs data
            let amendments = [];
            let otherNotifications = [];
            let submissions = [];
            if (existingSC.submissions) {
                for (const sub of existingSC.submissions) {
                    if (sub.isAmendment) {
                        amendments.push(sub);
                    } else if (sub.isOtherNotification) {
                        otherNotifications.push(sub);
                    } else {
                        submissions.push(sub);
                    }
                }
            }

            existingSC["amendments"] = amendments;
            existingSC["otherNotifications"] = otherNotifications;
            existingSC["submissions"] = submissions;

            this.getStudyCountriesForm().at(i).setValue(existingSC);

            // Setting SNs
            if (this.studyUsesCtisForSNs && this.contextService.isCtisCountry(this.g[i].value?.country)) {
                this.setSharedSnForms(i);
            } else {
                const sns = this.getSeparatedSNs(existingSC);
                this.createSnForms(existingSC, i, sns.snsAnnualCa, sns.snsAnnualEc, sns.snsDsurCa, sns.snsDsurEc);
            }
        } else {  // No existing SC found, resetting form
            const study = this.g[i].value.study;
            const country = this.g[i].value.country;
            this.g[i].reset();
            this.getStudyCountriesForm().at(i).patchValue(this.newStudyCountry().value);
            this.getStudyCountriesForm().at(i).patchValue({ study: study, country: country });

            // Setting SNs
            if (this.studyUsesCtisForSNs && this.contextService.isCtisCountry(this.g[i].value?.country)) {
                this.setSharedSnForms(i);
            } else {
                this.setEmptySnForms(i);
            }
        }

        // Checking if the country that was just changed was the country where the CTIS flag was checked?
        let wasCountryWhereCtisFlagChecked = true;
        if (this.studyUsesCtisForSNs) {
            for (const [i, sc] of this.g.entries()) {
                // If we don't find it in the current list of SCs, that means it was the changed country
                if (this.isCountryWhereCtisFlagChecked(sc.value?.country)) {
                    wasCountryWhereCtisFlagChecked = false;
                    break;
                }
            }
        } else {
            wasCountryWhereCtisFlagChecked = false;
        }

        // Checking if the changed country was the one were CTIS flag was checked
        // and it was the last CTIS country, in which case we need to re-assign checked country/change ctis check
        if (this.studyUsesCtisForSNs && wasCountryWhereCtisFlagChecked) {
            let lastCtisSc: boolean = true;

            for (const [i, sc] of this.g.entries()) {
                if (this.contextService.isCtisCountry(sc.value?.country)) {
                    lastCtisSc = false;
                    // Found another CTIS SC, re-assigning flag checked country to this other CTIS SC
                    this.countryWhereCtisFlagChecked = this.getStudyCountriesForm().at(i).value.country;
                    this.snFormSharedIndex = i;
                    break;
                }
            }

            if (lastCtisSc) { // If it's the last CTIS SC, unchecking CTIS check
                this.changeStudyUsesCtisForSafetyNotifications();
            }
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.studyCountriesData?.currentValue?.length > 0) {
            this.studyCountries = this.studyCountriesData;
            this.patchForm();
        }
    }

    addStudyCountry() {
        this.getStudyCountriesForm().push(this.newStudyCountry());
        this.setEmptySnForms(this.getStudyCountriesForm().length - 1);  // Adding SN forms
    }

    handleLastCtisScCase(scToDelete): boolean {
        // Check if it's the last CTIS-SC, in that case we need to delete SNs
        let lastCtisSc: boolean = true;

        if (this.studyUsesCtisForSNs && this.isCountryWhereCtisFlagChecked(scToDelete.country)) {
            for (const [i, sc] of this.g.entries()) {
                if (this.contextService.isCtisCountry(sc.value?.country) && !this.isCountryWhereCtisFlagChecked(sc.value?.country)) {
                    lastCtisSc = false;
                    // Found another CTIS SC, re-assigning flag checked country to this other CTIS SC
                    this.countryWhereCtisFlagChecked = this.getStudyCountriesForm().at(i).value.country;
                    this.snFormSharedIndex = i;
                    break;
                }
            }

            if (lastCtisSc) { // If it's the last CTIS SC, unchecking CTIS check
                this.changeStudyUsesCtisForSafetyNotifications();
            }
        } else {
            lastCtisSc = false;
        }

        return lastCtisSc
    }

    deleteStudyCountry($event, i: number) {
        $event.stopPropagation(); // Expands the panel otherwise

        const scToDelete = this.getStudyCountriesForm().value[i];
        this.handleLastCtisScCase(scToDelete);

        this.getStudyCountriesForm().removeAt(i);
        // Removing a row doesn't make the form dirty, needed for the unsaved changes popup (#6)
        this.getStudyCountriesForm().markAsDirty();
        this.snForms.splice(i, 1);  // Removing SNs forms entry
    }

    isFormValid() {
        this.submitted = true;

        // Manually checking country field (shouldn't be empty)
        for (const i in this.form.get("studyCountries")['controls']) {
            if (this.form.get("studyCountries")['controls'][i].value.country == null) {
                this.form.get("studyCountries")['controls'][i].controls.country.setErrors({ 'required': true });
            }
        }

        if (!this.form.valid) {
            this.toastr.error("Please correct the errors in the study countries form");
        }

        // TODO
        return this.form.valid && !this.studyCTUComponents.some(b => !b.isFormValid());
    }

    updatePayload(payload, studyId, i) {
        payload.study = studyId;

        if (payload.country?.iso2) {
            payload.country = payload.country.iso2;
        }

        // Note: needs to be changed if possible to add a new study country not from the higher level pages
        if (!this.isSCPage) {
            payload.order = i;
        }
    }

    updateFullPayload(studyCountries, studyId): StudyCountryInterface[] {
        for (let [index, sc] of studyCountries.entries()) {
            sc.study = studyId;

            if (sc.country?.iso2) {
                sc.country = sc.country.iso2;
            }

            // Note: would need to be changed if possible to add a new study country not from the higher level pages
            if (!this.isSCPage) {
                sc.order = index;
            }
        }

        return studyCountries;
    }

    getSafetyNotificationsForSC(studyCountries: StudyCountryInterface[]): Observable<StudyCountryInterface[]> {
        const snComponentsAndItems: [QueryList<any>, string][] = [
            [this.safetyNotificationsAnnualEC, "safety notifications"],
            [this.safetyNotificationsAnnualCA, "safety notifications"],
            [this.safetyNotificationsDsurEC, "safety notifications"],
            [this.safetyNotificationsDsurCA, "safety notifications"],
        ];

        let scObs$: Observable<StudyCountryInterface>[] = [];

        for (const [i, sc] of studyCountries.entries()) {
            const obs$: Observable<any>[] = [];

            if (!(this.studyUsesCtisForSNs && this.isCtisCountry(sc.country) && !this.isCountryWhereCtisFlagChecked(sc.country))) {
                for (let [component, itemType] of snComponentsAndItems) { // Saving all SNs
                    // TODO: line below shouldn't be needed as this should be filtered if the first if, to fix
                    if (component.get(i)) { // Components don't exist for CTIS SCs if ctis check true and they're not the SC where CTIS check ticked, note: if they do, need to change logic
                        obs$.push(component.get(i).onSave().pipe(
                            map((res: string[]) => {
                                if (res?.length > 0 && !(res?.length === 1 && res[0] === null)) {
                                    // Note: if ctis flag false and it's a ctis country but not where flag was checked, it will have already been filtered out above (before loop)
                                    // Note 2: if ctis flag true and SC is ctis country where flag was checked, we save SN ids in current SC and we will populate
                                    //         all other CTIS SCs SN ids later
                                    res.forEach((id) => {
                                        if (id) {
                                            sc.safetyNotifications.push(id);  // Linking saved SN with SC
                                        } else {
                                            this.toastr.error(`Failed to add ${itemType}`);
                                        }
                                    });
                                }
                            })
                        ));
                    }
                }
            }

            if (obs$.length == 0) {
                obs$.push(of(true));
            }

            scObs$.push(
                combineLatest(obs$).pipe(
                    mapTo(sc)
                )
            );
        }

        // For SC Page, adding CTIS-countries observables to update their SNs (note: hacky with types) if SNs shared
        // or if SNs were shared but not anymore
        if (this.isSCPage) {
            if (studyCountries.length === 1) {
                const editedSc = studyCountries[0];
                if ((this.studyUsesCtisForSNs && this.isCtisCountry(editedSc.country) && editedSc.study?.studyCountries?.length > 0)
                    || (!this.studyUsesCtisForSNs && this.studyUsesCtisForSNsChanged && editedSc.study?.studyCountries?.length > 0)) {
                    const currCountryId = studyCountries[0]?.id;
                    for (const sc of editedSc.study.studyCountries) { // Going through all SCs of the parent study
                        if (this.contextService.isCtisCountry(sc.country) && sc.id != currCountryId) {
                            scObs$.push(of(sc));
                        }
                    }
                }
            } else {
                this.toastr.error(`Unexpected number of study countries: ${studyCountries.length}`);
            }
        }

        return combineLatest(scObs$);
    }

    setSharedSafetyNotifications(studyCountries: StudyCountryInterface[]): StudyCountryInterface[] {
        if (this.studyUsesCtisForSNs) {
            const scWithSn: StudyCountryInterface = studyCountries.find((sc) => this.isCountryWhereCtisFlagChecked(sc.country)); // SC where flag was checked has the SNs to share
            if (scWithSn) {
                for (const sc of studyCountries) {
                    if (this.contextService.isCtisCountry(sc.country)) {
                        sc.safetyNotifications = scWithSn.safetyNotifications;
                    }
                }
            } else if (!(this.isSCPage && !this.isCtisCountry(studyCountries[0]?.country))) {
                this.toastr.error("Couldn't find study country where CTIS flag was checked");
            }
        } else if (this.isSCPage && !this.studyUsesCtisForSNs && this.studyUsesCtisForSNsChanged) {
            // Unlinking previously linked SNs (SC page)
            const currCountryId = studyCountries[0]?.id;
            for (const sc of studyCountries) {
                if (this.contextService.isCtisCountry(sc.country) && sc.id != currCountryId) {
                    sc.safetyNotifications = [];
                }
            }
        }

        return studyCountries;
    }

    setSharedNotApplicableFields(studyCountries: StudyCountryInterface[]): StudyCountryInterface[] {
        if (this.studyUsesCtisForSNs && this.isSCPage) {
            const currCountry = studyCountries[0];

            for (const sc of studyCountries) {
                if (this.contextService.isCtisCountry(sc.country) && sc.id != currCountry?.id) {
                    sc.snAnnualEcNa = currCountry.snAnnualEcNa;
                    sc.snAnnualCaNa = currCountry.snAnnualCaNa;
                    sc.snDsurEcNa = currCountry.snDsurEcNa;
                    sc.snDsurCaNa = currCountry.snDsurCaNa;
                }
            }
        }
        return studyCountries;
    }

    getScSaveObs$(studyCountries: StudyCountryInterface[]): Observable<boolean>[] {
        // Saving SCs and subcomponents other than safety notifications
        // TODO: split method, currently too long

        const regularSubcomponentsAndItems: [QueryList<any>, string][] = [
            [this.studyCTUComponents, "study CTUs"],
            [this.amendmentsComponents, "amendments"],
            [this.notificationsComponents, "notifications"],
            [this.otherNotificationsComponents, "other notifications"],
            [this.submissionsComponents, "submissions"],
        ];

        let saveObs$: Observable<boolean>[] = [];

        // Updating usesCtisForSafetyNotifications in study
        if (studyCountries.length > 0) {
            if (this.studyUsesCtisForSNsChanged) {
                saveObs$.push(
                    this.studyService.changeUsesCtisForSafetyNotifications(studyCountries[0].study, this.studyUsesCtisForSNs).pipe(
                        mergeMap((res: any) => {
                            if (res.statusCode === 200) {
                                return of(true);
                            } else {
                                this.toastr.error(res);
                                return of(false);
                            }
                        }), catchError(err => {
                            this.toastr.error(err);
                            return of(false);
                        })
                    )
                );
            }
        }

        for (const [i, sc] of studyCountries.entries()) {
            let scQueryObs$: Observable<Object>;

            if (sc.id) {  // Edit
                scQueryObs$ = this.studyCountryService.editStudyCountry(sc.id, sc);
            } else {  // Add
                scQueryObs$ = this.studyCountryService.addStudyCountry(sc.study, sc);
            }

            saveObs$.push(scQueryObs$.pipe(  // Saving study country first
                mergeMap((res: any) => {
                    if ((!sc.id && res.statusCode === 201) || (sc.id && res.statusCode === 200)) {
                        let subObs$: Observable<Boolean>[] = [];

                        // Saving all "subcomponents" (except safety notifications)
                        for (let [component, itemType] of regularSubcomponentsAndItems) {
                            let onSaveObs$;

                            if (component.get(i)) {
                                if (component === this.studyCTUComponents) {
                                    onSaveObs$ = component.get(i).onSave(res.id, sc.study);
                                } else {
                                    onSaveObs$ = component.get(i).onSave(res.id);
                                }

                                subObs$.push(
                                    onSaveObs$.pipe(
                                        mergeMap((successArr: boolean[]) => {
                                            const success: boolean = successArr.every(b => b);
                                            if (!success) {
                                                this.toastr.error(`Failed to add ${itemType}`);
                                            }
                                            return of(success);
                                        })
                                    )
                                );
                            }
                        }

                        if (subObs$.length == 0) {
                            subObs$.push(of(true));
                        }

                        return combineLatest(subObs$).pipe(
                            mergeMap((successArr: boolean[]) => {
                                const success: boolean = successArr.every(b => b);
                                return of(success);
                            })
                        );
                    }
                    return of(false);
                })
            ));
        }

        // Used to check for SCs that have been "soft deleted" from the interface, 
        // as in by switching country for an existing SC rather than deleting the SC and making a new one
        const formScIds: Array<Number> = studyCountries.map((item: StudyCountryInterface) => { return item.id; });
        const softDeletedScs: Array<StudyCountryInterface> = this.studyCountries.filter((initialSc) => formScIds.indexOf(initialSc.id) < 0);

        softDeletedScs.forEach((sc) => {
            // Deleting SC "soft deleted" from the interface (see comment above)
            saveObs$.push(this.studyCountryService.deleteStudyCountry(sc.id).pipe(
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

        return saveObs$;
    }

    getSNDeleteObs$(res: boolean[]): Observable<boolean[]> {
        if (res.every(a => a)) {
            return this.safetyNotificationService.deleteOrphanSafetyNotifications().pipe(
                mergeMap((res: any) => {
                    if (res.statusCode === 200) {
                        return of([true]);
                    } else {
                        this.toastr.error(res);
                        return of([false]);
                    }
                }), catchError(err => {
                    this.toastr.error(err);
                    return of([false]);
                })
            );
        }

        return of([false]);
    }

    onSave(studyId: string): Observable<boolean[]> {
        this.submitted = true;

        const payload = JSON.parse(JSON.stringify(this.form.value));
        const studyCountries: StudyCountryInterface[] = payload.studyCountries;

        if (studyCountries?.length > 0) {
            return of(studyCountries)
                .pipe(
                    mergeMap((studyCountries: StudyCountryInterface[]) => this.getSafetyNotificationsForSC(studyCountries)),  // Save SNs and populates sc.safetyNotifications (except for ctis countries with shared SNs)
                    map((studyCountries: StudyCountryInterface[]) => this.setSharedSafetyNotifications(studyCountries)),  // Populate sc.safetyNotifications for ctis countries with shared SNs
                    map((studyCountries: StudyCountryInterface[]) => this.setSharedNotApplicableFields(studyCountries)),  // When saving from a CTIS study country page, sync not applicable fields with other CTIS countries
                    map((studyCountries: StudyCountryInterface[]) => this.updateFullPayload(studyCountries, studyId)),
                    mergeMap((studyCountries: StudyCountryInterface[]) => forkJoin(this.getScSaveObs$(studyCountries))),  // Save SCs + other subcomponents
                    mergeMap((res: boolean[]) => this.getSNDeleteObs$(res)),    // Deleting orphan SNs
                    catchError((err) => {
                        this.toastr.error(err, "Failed to save study country", { timeOut: 20000, extendedTimeOut: 20000 });
                        return of([false]);
                    })
                );
        }
        return of([true]);
    }

    isCountryWhereCtisFlagChecked(c: CountryInterface) {
        return this.countryWhereCtisFlagChecked?.iso2 === c?.iso2;
    }

    onSaveStudyCountry() {
        this.spinner.show();

        if (this.isFormValid()) {
            const studyId = this.form.value?.studyCountries[0]?.study?.id;
            if (studyId) {
                this.onSave(studyId).subscribe((success) => {
                    this.spinner.hide();
                    if (success.every(s => s)) { // success is a boolean[]: a non-empty array is always truthy on its own
                        this.toastr.success("Changes saved successfully");
                        this.unsavedChangesService.markAllAsPristine();
                        this.router.navigate([`/study-countries/${this.id}/view`]);
                    } else {
                        this.toastr.error("One or more items failed to save");
                    }
                });
            } else {
                this.spinner.hide();
                this.toastr.error("Couldn't get study ID from study country");
            }
        } else {
            this.spinner.hide(); // Prevent infinite spinner when the form is invalid
        }
    }

    changeStudyUsesCtisForSafetyNotifications() {
        this.studyUsesCtisForSNs = !this.studyUsesCtisForSNs;
        this.studyUsesCtisForSNsChanged = !this.studyUsesCtisForSNsChanged; // Tracking check change
    }

    onChangeCtis($event, i) {
        const confirmationModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
        confirmationModal.componentInstance.title = "Safety notification - CTIS change";
        confirmationModal.componentInstance.buttonClass = "btn-success";
        confirmationModal.componentInstance.buttonMessage = "Apply";

        const countryName = this.g[i].value?.country?.name;
        if (!this.studyUsesCtisForSNs) {
            confirmationModal.componentInstance.message = `This will replace all other CTIS study countries' safety notifications with the data from this study country (${countryName}). Continue?`;
        } else {
            confirmationModal.componentInstance.message = `This will delete all other CTIS study countries' safety notifications. Continue?`;
        }

        confirmationModal.result.then((proceed) => {
            if (proceed) {
                this.changeStudyUsesCtisForSafetyNotifications();

                if (this.studyUsesCtisForSNs) { // Box ticked
                    // Saving SC where box was ticked, to use the safety notifications from this SC
                    this.countryWhereCtisFlagChecked = this.getStudyCountriesForm().at(i).value.country;
                    this.snFormSharedIndex = i;

                    // Replacing other CTIS SC SNs forms with the SNs from the SC where box was ticked
                    if (!this.isSCPage) {
                        for (const [index, sc] of this.form.value.studyCountries?.entries()) {
                            if (this.isCtisCountry(sc.country) && !this.isCountryWhereCtisFlagChecked(sc.country)) {
                                this.setSharedSnForms(index);
                            }
                        }
                    }

                } else {  // Box unticked
                    this.countryWhereCtisFlagChecked = this.getStudyCountriesForm().at(i).value.country;

                    // Replacing other CTIS SC SNs forms with new ones
                    if (!this.isSCPage) {
                        for (const [index, sc] of this.form.value.studyCountries?.entries()) {
                            if (this.isCtisCountry(sc.country) && !this.isCountryWhereCtisFlagChecked(sc.country)) {
                                this.setEmptySnForms(index);
                            }
                        }
                    }

                    this.countryWhereCtisFlagChecked = null;  // Setting this to null after unlinking SNs
                }
            }

            $event.target.checked = this.studyUsesCtisForSNs;

        }, error => { this.toastr.error(error) });
    }

    getSNItemsForTickedNA(fcName: string, i) {
        if (fcName) {
            if (fcName === "snAnnualEcNa") {
                return this.snForms[i].snAnnualEcForm;
            } else if (fcName === "snAnnualCaNa") {
                return this.snForms[i].snAnnualCaForm;
            } else if (fcName === "snDsurEcNa") {
                return this.snForms[i].snDsurEcForm;
            } else if (fcName === "snDsurCaNa") {
                return this.snForms[i].snDsurCaForm;
            }
        }
        return null;
    }

    onChangeNotApplicable($event, i) {
        // Case 4: study country, CTIS - ???

        // Only showing on ticking box and if there are existing safety notifications
        const fcName = $event?.target?.getAttribute("formControlName");
        let snFormTicked = this.getSNItemsForTickedNA(fcName, i);

        const currSCValue = this.getStudyCountriesForm().at(i).value;
        const ctisCase = this.studyUsesCtisForSNs && this.isCtisCountry(currSCValue?.country);

        if ($event.target.checked && snFormTicked?.value?.safetyNotifications?.length > 0) {
            // Not checking the checkbox or setting boolean to true for now
            $event.target.checked = false;
            this.getStudyCountriesForm().at(i).get(fcName)?.setValue(false);

            const confirmationModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
            confirmationModal.componentInstance.title = "Safety notification - N/A";
            confirmationModal.componentInstance.buttonClass = "btn-success";
            confirmationModal.componentInstance.buttonMessage = "Apply";

            const snNumber = snFormTicked?.value?.safetyNotifications?.length;
            if (!ctisCase) {
                confirmationModal.componentInstance.message = `This will delete the existing ${snNumber === 1 ? '' : snNumber} safety notification item${snNumber === 1 ? '' : 's'}. Continue?`;
            } else {
                confirmationModal.componentInstance.message = `This will delete the existing ${snNumber === 1 ? '' : snNumber} safety notification item${snNumber === 1 ? '' : 's'} this country as well as all the other CTIS countries too. Continue?`;
            }

            confirmationModal.result.then((proceed) => {
                if (proceed) {
                    // Setting checkbox field to true, hides SNs form
                    this.getStudyCountriesForm().at(i).get(fcName)?.setValue(true);

                    // Emptying form
                    this.emptySnForm(snFormTicked);

                    if (ctisCase) {
                        // Update other CTIS countries boolean fields
                        this.patchNotApplicable(i);
                    }
                }

                $event.target.checked = proceed;
            }, error => { this.toastr.error(error) });
        } else if (ctisCase) {
            // Update other CTIS countries boolean fields
            this.patchNotApplicable(i);
        }
    }

    patchNotApplicable(i) {
        if (!this.isSCPage) {
            const currSCValue = this.getStudyCountriesForm().at(i).value;
            for (const [index, sc] of this.form.value.studyCountries?.entries()) {
                if (this.isCtisCountry(sc.country) && sc.country?.iso2 != currSCValue?.country?.iso2) {
                    this.getStudyCountriesForm().at(index).patchValue({
                        snAnnualEcNa: currSCValue.snAnnualEcNa,
                        snAnnualCaNa: currSCValue.snAnnualCaNa,
                        snDsurEcNa: currSCValue.snDsurEcNa,
                        snDsurCaNa: currSCValue.snDsurCaNa
                    });
                }
            }
        }
    }

    compareIds(fv1, fv2): boolean {
        return fv1?.id == fv2?.id;
    }

    compareCountries(c1, c2): boolean {
        return c1?.iso2 === c2?.iso2;
    }

    getCountryFlag(country) {
        if (country?.iso2) {
            return getFlagEmoji(country.iso2);
        }
        return '';
    }

    getTagBorderColor(text) {
        return getTagBorderColor(text);
    }

    getTagBgColor(text) {
        return getTagBgColor(text);
    }

    searchCountries(term: string, item) {
        term = term.toLocaleLowerCase();
        return item.name?.toLocaleLowerCase().indexOf(term) > -1;
    }

    isCtisCountry(c: CountryInterface) {
        return this.contextService.isCtisCountry(c);
    }

    getAuthorityLabel(authorityCode: string) {
        let label: String = "";

        if (authorityCode === AuthorityCodes.EC) {
            label = EC_TEXT;
        } else if (authorityCode === AuthorityCodes.CA) {
            label = CA_TEXT;
        }

        return label;
    }

    back(): void {
        this.backService.back();
    }

    dateToString(date) {
        return dateToString(date);
    }

    scrollToElement(): void {
        setTimeout(() => {
            const yOffset = -200;
            const element = document.getElementById('featpanel' + this.len);
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        });
    }
}