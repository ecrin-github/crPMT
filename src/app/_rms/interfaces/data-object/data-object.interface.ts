import { OrganisationInterface } from '../context/organisation.interface';
import { StudyDataInterface } from '../study/study.interface';
import { ObjectContributorInterface } from './object-contributor.interface';
import {ObjectDatasetInterface} from './object-dataset.interface';
import {ObjectDateInterface} from './object-date.interface';
import {ObjectDescriptionInterface} from './object-description.interface';
import {ObjectIdentifierInterface} from './object-identifier.interface';
import {ObjectInstanceInterface} from './object-instance.interface';
import {ObjectRelationshipInterface} from './object-relationship.interface';
import {ObjectRightInterface} from './object-right.interface';
import {ObjectTitleInterface} from './object-title.interface';
import {ObjectTopicInterface} from './object-topic.interface';

export interface DataObjectInterface {
    id: number;
    sdOid: string | null;
    linkedStudy: StudyDataInterface | null;
    doi: string | null;
    displayTitle: string | null;
    version: string | null;
    objectClass: {id:number, name: string};
    objectType: {id:number, name: string};
    publicationYear: number;
    langCode: {id:number, langNameEn: string} | null;
    accessType: {id: number, name: string};
    embargoExpiry: string;
    managingOrgId: number;
    managingOrg: {id: number, defaultName: string } | null;
    accessDetails: string | null;
    accessDetailsUrl: string | null;
    eoscCategory: number;
    doiStatusId: number;
    managingOrgRorId: string | null;
    urlLastChecked: string | null;
    addStudyContribs: boolean;
    addStudyTopics: boolean;
    createdOn: string;
    organisation: OrganisationInterface | null;
    objectContributors: ObjectContributorInterface[] | null;
    objectDatasets: ObjectDatasetInterface[] | null;
    objectDates: ObjectDateInterface[] | null;
    objectDescriptions: ObjectDescriptionInterface[] | null;
    objectIdentifiers: ObjectIdentifierInterface[] | null;
    objectInstances: ObjectInstanceInterface[] | null;
    objectRelationships: ObjectRelationshipInterface[] | null;
    objectRights: ObjectRightInterface[] | null;
    objectTitles: ObjectTitleInterface[] | null;
    objectTopics: ObjectTopicInterface[] | null;
}


export interface DataObjectDataInterface {
    id: number;
    sdOid: string | null;
    sdSid: string | null;
    displayTitle: string | null;
    version: string | null;
    doi: string | null;
    doiStatusId: number;
    publicationYear: number;
    objectClassId: number;
    objectTypeId: number;
    managingOrgId: number;
    managingOrg: string | null;
    managingOrgRorId: string | null;
    langCode: string | null;
    accessTypeId: number;
    accessDetails: string | null;
    accessDetailsUrl: string | null;
    urlLastChecked: string | null;
    eoscCategory: number;
    addStudyContribs: boolean;
    addStudyTopics: boolean;
    createdOn: string;
}
