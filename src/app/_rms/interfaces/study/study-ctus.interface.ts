import { ClassValueInterface } from "../context/class-value.interface";
import { CTUInterface } from "../context/ctu.interface";
import { CentreInterface } from "./centre.interface";
import { StudyCountryInterface } from "./study-country.interface";
import { StudyMainDataInterface } from "./study.interface";

export interface StudyCTUInterface {
    id: number;
    leadCtu: boolean;
    services: ClassValueInterface[];
    study: StudyMainDataInterface;
    studyCountry: StudyCountryInterface;
    ctu: CTUInterface;
    centres: CentreInterface[];
}
