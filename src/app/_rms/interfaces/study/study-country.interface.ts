import { StudyMainDataInterface } from "./study.interface";

export interface StudyCountryInterface {
    id: number;
    leadCountry: boolean;
    country: string;
    submissionDate: string;
    approvalDate: string;
    study: StudyMainDataInterface;
}
