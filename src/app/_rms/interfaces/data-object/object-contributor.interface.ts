export interface ObjectContributorInterface {
    id: number;
    sdOid: string;
    contribTypeId: number;
    isIndividual: boolean;
    personId: number;
    personGivenName: string;
    personFamilyName: string;
    personFullName: string;
    orcidId: string;
    personAffiliation: string;
    organisationId: number;
    organisationName: string;
    organisationRorId: string;
    createdOn: string;
}
