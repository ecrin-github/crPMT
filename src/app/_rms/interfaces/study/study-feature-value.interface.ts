import { StudyFeatureTypeInterface } from "./study-feature-type.interface";

export interface StudyFeatureValueInterface {
    id: string;
    featureType: StudyFeatureTypeInterface;
    name: string;
    source: string;
    description: string;
    dateAdded: string;
    listOrder: number;
}