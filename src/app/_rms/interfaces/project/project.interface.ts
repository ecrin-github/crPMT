import { StudyDataInterface } from "../study/study.interface";

export interface ProjectInterface {
    id: string | null;
    gaNumber: string | null;
    shortName: string | null;
    name: string | null;
    url: string | null;
    startDate: string | null;
    endDate: string | null;
    studies: StudyDataInterface[] | null;
}
