import { StudyInterface } from "./study.interface";

export interface SatisfactionSurveyInterface {
    id: string;
    surveyType: string;
    year: number;
    numberOfRecipients: number;
    sentDate: string;
    study: StudyInterface;
    order: number;
}
