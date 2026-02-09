import { CountryInterface } from "../context/country.interface";
import { NotificationInterface } from "./notification.interface";
import { SafetyNotificationInterface } from "./safety-notification.interface";
import { StudyCTUInterface } from "./study-ctus.interface";
import { StudyMainDataInterface } from "./study.interface";
import { SubmissionInterface } from "./submission.interface";

export interface StudyCountryInterface {
    id: number;
    country: CountryInterface;
    notifications: NotificationInterface[];
    safetyNotifications: any[];
    study: StudyMainDataInterface;
    studyCtus: StudyCTUInterface[];
    submissions: SubmissionInterface[];
    isCountryWhereCtisFlagChecked: boolean;
}

export interface StudyCountryMainDetailsInterface {
    id: number;
    country: CountryInterface;
    studyCtus: StudyCTUInterface[];
}
