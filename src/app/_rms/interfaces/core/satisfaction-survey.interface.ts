import { StudyInterface } from "./study.interface";

export interface SatisfactionSurveyInterface {
    id: string;
    surveyType: string;
    numberOfRecipients: number;
    sentDate: string;
    study: StudyInterface;
    order: number;
}
