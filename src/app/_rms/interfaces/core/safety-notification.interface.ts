import { UntypedFormGroup } from "@angular/forms";
import { SafetyNotificationTypeInterface } from "../context/safety-notification-type.interface";
import { StudyCountryInterface } from "./study-country.interface";

export interface SafetyNotificationInterface {
    id: string;
    authority: string;
    year: string;
    submissionDate: string;
    notApplicable: boolean;
    notificationType: SafetyNotificationTypeInterface;
    studyCountry: StudyCountryInterface;
    order: number;
}

export interface SafetyNotificationFormsInterface {
    snAnnualCaForm: UntypedFormGroup;
    snAnnualEcForm: UntypedFormGroup;
    snDsurCaForm: UntypedFormGroup;
    snDsurEcForm: UntypedFormGroup;
}