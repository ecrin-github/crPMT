export interface DtpObjectInterface {
    id: number;
    dtpId: number;
    objectId: string;
    isDataset: boolean;
    accessTypeId: number;
    downloadAllowed: boolean;
    accessDetails: string;
    requiresEmbargoPeriod: boolean;
    embargoEndDate: string;
    embargoStillApplies: boolean;
    accessCheckStatusId: number;
    accessCheckDate: string;
    accessCheckBy: string;
    mdCheckStatusId: number;
    mdCheckDate: string;
    mdCheckBy: string;
    notes: string;
    createdOn: string;
}
