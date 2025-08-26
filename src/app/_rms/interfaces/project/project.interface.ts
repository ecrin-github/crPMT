import { ClassValueInterface } from "../context/class-value.interface";
import { OrganisationInterface } from "../context/organisation.interface";
import { StudyDataInterface } from "../study/study.interface";

export interface ProjectInterface {
    id: string;
    // General information
    name: string;
    shortName: string;
    coordinator: OrganisationInterface;
    startDate: string;
    endDate: string;
    // Project funding
    fundingSources: ClassValueInterface[];
    gaNumber: string;
    // Clinical study information
    studies: StudyDataInterface[];
    // Timelines according to Consortium
    reportingPeriods: string;
    // Publication information
    publicSummary: string;
    url: string;
    // TODO: publications
    totalPatientsExpected: string;
}
