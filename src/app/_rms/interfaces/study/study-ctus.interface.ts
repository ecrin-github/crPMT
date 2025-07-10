import { CTUInterface } from "../context/ctu.interface";
import { CentreInterface } from "./centre.interface";
import { StudyCountryInterface } from "./study-country.interface";
import { StudyMainDataInterface } from "./study.interface";

export interface StudyCTUInterface {
    id: number;
    study: StudyMainDataInterface;
    studyCountry: StudyCountryInterface;
    ctu: CTUInterface;
    centres: CentreInterface[];
}
