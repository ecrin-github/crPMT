import { StudyAgreementAmendmentInterface } from "./study-agreement-amendment.interface";
import { StudyInterface } from "./study.interface";

export interface StudyAgreementInterface {
    id: string;
    draftSentDate: string;
    signedBySponsorDate: string;
    signedByEcrinDate: string;
    fullyExecuted: boolean;
    startDate: string;
    endDate: string;
    comment: string;
    study: StudyInterface;
    studyAgreementAmendments: StudyAgreementAmendmentInterface[];
    order: number;
}
