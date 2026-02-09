import { ClassValueInterface } from "../context/class-value.interface";
import { CTUInterface } from "../context/ctu.interface";
import { CentreInterface } from "./centre.interface";
import { CTUAgreementInterface } from "./ctu-agreement.interface";
import { StudyCountryInterface } from "./study-country.interface";
import { StudyMainDataInterface } from "./study.interface";

export interface StudyCTUInterface {
    id: string;
    leadCtu: boolean;
    services: ClassValueInterface[];
    study: StudyMainDataInterface;
    studyCountry: StudyCountryInterface;
    ctu: CTUInterface;
    ctuAgreements: CTUAgreementInterface[];
    centres: CentreInterface[];
}
