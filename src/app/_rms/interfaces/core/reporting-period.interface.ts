import { ProjectInterface } from "./project.interface";

export interface ReportingPeriodInterface {
    id: string;
    start: string;
    end: string;
    stage: number;
    comment: string;
    project: ProjectInterface;
}