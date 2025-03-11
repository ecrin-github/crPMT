export interface DtpInterface {
    id: number;
    orgId: number;
    displayName: string;
    statusId: number;
    initialContactDate: string;
    setUpCompleted: string | null;
    mdAccessGranted: string;
    mdCompleteDate: string;
    dtaAgreedDate: string;
    uploadAccessRequested: string;
    uploadAccessConfirmed: string;
    uploadsComplete: string;
    qcChecksCompleted: string;
    mdIntegratedWithMdr: string;
    availabilityRequested: string;
    availabilityConfirmed: string;
    createdOn: string;
}
