import { CTUAgreementInterface } from "./ctu-agreement.interface";

export interface CTUAgreementAmendmentInterface {
    id: string;
    signedDate: string;
    ctuAgreement: CTUAgreementInterface;
    order: number;
}