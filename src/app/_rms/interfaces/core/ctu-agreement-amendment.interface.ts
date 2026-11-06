import { CTUAgreementInterface } from "./ctu-agreement.interface";

export interface CTUAgreementAmendmentInterface {
    id: string;
    signedDate: string;
    signedByCtuDate: string;
    signedByEcrinDate: string;
    newEndDate: string;
    ctuAgreement: CTUAgreementInterface;
    order: number;
}