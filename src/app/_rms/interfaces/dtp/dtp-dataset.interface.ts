export interface DtpDatasetInterface {
    id: number;
    objectId: string;
    legalStatusId: number;
    legalStatusText: string;
    legalStatusPath: string;
    descmdCheckStatusId: number;
    descmdCheckDate: string;
    descmdCheckBy: number;
    deidentCheckStatusId: number;
    deidentCheckDate: string;
    deidentCheckBy: number;
    notes: string;
    createdOn: string;
}
