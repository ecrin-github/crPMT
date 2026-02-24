import { StudyCountryInterface } from "./study-country.interface";

export interface NotificationInterface {
    id: number;
    authority: string;
    notApplicable: boolean;
    notificationDate: string;
    comment: string;
    studyCountry: StudyCountryInterface;
    order: number;
}
