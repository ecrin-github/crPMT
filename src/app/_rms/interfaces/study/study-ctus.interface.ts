import { CTUInterface } from "../context/ctu.interface";
import { PersonInterface } from "../person.interface";
import { StudyCountryInterface } from "./study-country.interface";
import { StudyMainDataInterface } from "./study.interface";

export interface StudyCTUInterface {
    id: number;

    siteNumber: number;
    patientsExpected: number;
    recruitmentGreenlight: string;
    movExpectedNumber: number;
    study: StudyMainDataInterface;
    studyCountry: StudyCountryInterface;
    ctu: CTUInterface;
    pi: PersonInterface;
    piNationalCoordinator: boolean;
}
