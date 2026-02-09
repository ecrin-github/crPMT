import { CentreInterface } from "./centre.interface";

export interface VisitInterface {
    id: string;
    visitType: string,
    visitDate: string,
    pharmacy: string,
    duration: string,
    durationUnit: string,
    comment: string,
    reportSent: boolean,
    reportSentDate: string,
    reportApproved: boolean,
    reportApprovedDate: string,
    centre: CentreInterface | string,
}