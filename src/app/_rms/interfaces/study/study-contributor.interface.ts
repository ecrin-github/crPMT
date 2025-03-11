import { OrganisationInterface } from "../organisation/organisation.interface";
import { UserInterface } from "../user/user.interface";
import { StudyContributorTypeInterface } from "./study-contributor-type.interface";

export interface StudyContributorInterface {
    id: number;
    contributorType: StudyContributorTypeInterface;
    person: UserInterface;
    organisation: OrganisationInterface;
    lastEditedBy: UserInterface;
    isIndividual: boolean;
    createdOn: string;
    studyId: string;
}