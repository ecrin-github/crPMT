export interface DupInterface {
    id: number;
    orgId: number;
    displayName: string;
    statusId: number;
    initialContactDate: string;
    setUpCompleted: string | null;
    prereqsMet: string;
    duaAgreedDate: string;
    availabilityRequested: string;
    availabilityConfirmed: string;
    accessConfirmed: string;
    createdOn: string;
}
