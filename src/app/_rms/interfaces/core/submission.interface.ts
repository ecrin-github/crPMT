import { StudyCountryInterface } from "./study-country.interface";

export interface SubmissionInterface {
    id: number;
    authority: string;
    notApplicable: boolean;
    submissionDate: string;
    approvalDate: string;
    protocolApprovalDate: string;
    protocolApprovedVersion: string;
    comment: string;
    isAmendment: boolean;
    amendmentReason: string;
    isOtherNotification: boolean;
    studyCountry: StudyCountryInterface;
    order: number;
}
