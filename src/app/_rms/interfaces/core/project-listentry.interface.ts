import { ClassValueInterface } from "../context/class-value.interface";
import { OrganisationInterface } from "../context/organisation.interface";
import { PersonInterface } from "../context/person.interface";
import { StudyMainDataInterface } from "./study.interface";

export interface ProjectListEntryInterface {
    shortName: string | null;
    name: string | null;
    startDate: string | null;
    endDate: string | null;
    coordinatingInstitution: OrganisationInterface | null;
    projectCoordinator: PersonInterface | null;
    fundingSources: ClassValueInterface | null;
    studies: StudyMainDataInterface | null;
}