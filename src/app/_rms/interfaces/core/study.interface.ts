import { ProjectInterface } from "./project.interface";
import { StudyCountryInterface } from "./study-country.interface";

export interface StudyInterface {
    id: string | null;
    project: ProjectInterface | null;
    shortTitle: string | null;
    title: string | null;
    status: string | null;
    // pi: string | null;
    sponsor: string | null;
    regulatoryFramework: string | null;
    trialId: string | null;
    category: string | null;
    summary: string | null;
    studyCountries: StudyCountryInterface[] | null;
}

// TODO
export interface StudyDataInterface {
    id: string | null;
    shortTitle: string | null;
    title: string | null;
    status: string | null;
    // pi: string | null;
    sponsor: string | null;
    regulatoryFramework: string | null;
    trialId: string | null;
    category: string | null;
    summary: string | null;
}


export interface StudyMainDataInterface {
    id: string | null;
    shortTitle: string | null;
    title: string | null;
    project: ProjectInterface;
    studyCountries: StudyCountryInterface[];
    usesCtisForSafetyNotifications: boolean;
}