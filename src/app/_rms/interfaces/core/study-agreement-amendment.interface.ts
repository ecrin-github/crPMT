import { StudyAgreementInterface } from "./study-agreement.interface";

export interface StudyAgreementAmendmentInterface {
    id: string;
    signedBySponsorDate: string;
    signedByEcrinDate: string;
    newEndDate: string;
    studyAgreement: StudyAgreementInterface;
    order: number;
}
