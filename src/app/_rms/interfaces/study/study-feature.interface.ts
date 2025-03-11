import { UserInterface } from "../user/user.interface";
import { StudyFeatureTypeInterface } from "./study-feature-type.interface";
import { StudyFeatureValueInterface } from "./study-feature-value.interface";

export interface StudyFeatureInterface {
    id: number;
    sdSid: string;
    featureType: StudyFeatureTypeInterface;
    featureValue: StudyFeatureValueInterface;
    lastEditedBy: UserInterface;
    createdOn: string;
    studyId: string;
}
