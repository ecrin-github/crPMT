import { CountryInterface } from "../context/country.interface";
import { StudyMainDataInterface } from "./study.interface";

export interface StudyCountryInterface {
    id: number;
    leadCountry: boolean;
    country: CountryInterface;
    submissionDate: string;
    approvalDate: string;
    study: StudyMainDataInterface;
}
