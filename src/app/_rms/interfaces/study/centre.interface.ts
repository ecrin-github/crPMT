import { CTUInterface } from "../context/ctu.interface";
import { PersonInterface } from "../context/person.interface";
import { StudyCountryInterface } from "./study-country.interface";
import { StudyCTUInterface } from "./study-ctus.interface";
import { StudyMainDataInterface } from "./study.interface";

export interface CentreInterface {
    id: number;

    siteNumber: number;
    patientsExpected: number;
    recruitmentGreenlight: string;
    movExpectedNumber: number;
    town: string;
    hospital: string;
    firstPatientVisit: string;
    study: StudyMainDataInterface;
    studyCtu: StudyCTUInterface;
    ctu: CTUInterface;
    pi: PersonInterface;
    piNationalCoordinator: boolean;
}
