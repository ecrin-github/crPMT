import { FundingSourceInterface } from "../context/funding-source.interface";
import { ServiceInterface } from "../context/service.interface";
import { PersonInterface } from "../person.interface";
import { StudyDataInterface } from "../study/study.interface";

export interface ProjectInterface {
    id: string | null;
    gaNumber: string | null;
    shortName: string | null;
    name: string | null;
    url: string | null;
    startDate: string | null;
    endDate: string | null;
    totalPatientsExpected: string | null;
    studies: StudyDataInterface[] | null;
    fundingSources: FundingSourceInterface[];
    services: ServiceInterface[];
    reportingPeriods: string;   // TODO
    coordinator: string;
    cEuco: PersonInterface;
}
