import { CTUInterface } from "../context/ctu.interface";
import { HospitalInterface } from "../context/hospital.interface";
import { PersonInterface } from "../context/person.interface";
import { StudyCTUInterface } from "./study-ctus.interface";
import { StudyMainDataInterface } from "./study.interface";

export interface CentreInterface {
    id: number;
    hospital: HospitalInterface;
    siteNumberFlag: boolean;
    siteNumber: number;
    pi: PersonInterface;
    piNationalCoordinator: boolean;
    patientsExpected: number;
    firstPatientVisit: string;
    movExpectedNumber: number;
    study: StudyMainDataInterface;
    studyCtu: StudyCTUInterface;
    ctu: CTUInterface;
}
