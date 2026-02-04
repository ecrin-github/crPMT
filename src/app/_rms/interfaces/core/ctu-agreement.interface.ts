import { ClassValueInterface } from "../context/class-value.interface";
import { CTUAgreementAmendmentInterface } from "./ctu-agreement-amendment.interface";
import { StudyCTUInterface } from "./study-ctus.interface";

export interface CTUAgreementInterface {
    id: string;
    signed: boolean;
    startDate: string;
    endDate: string;
    ctuStatus: ClassValueInterface;
    studyCtu: StudyCTUInterface;
    ctuAgreementAmendments: CTUAgreementAmendmentInterface[];
    order: number;
}