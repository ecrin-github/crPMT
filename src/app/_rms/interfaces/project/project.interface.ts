import { ClassValueInterface } from "../context/class-value.interface";
import { OrganisationInterface } from "../context/organisation.interface";
import { PersonInterface } from "../context/person.interface";
import { StudyDataInterface } from "../study/study.interface";

export interface ProjectInterface {
    id: string;
    // General information
    name: string;
    shortName: string;
    coordinator: PersonInterface;
    coordinatingInstitution: OrganisationInterface;
    startDate: string;
    endDate: string;
    // Project funding
    fundingSources: ClassValueInterface[];
    gaNumber: string;
    // Clinical study information
    studies: StudyDataInterface[];
    // TODO
    reportingPeriods: [];
    // Publication information
    publicSummary: string;
    url: string;
}
