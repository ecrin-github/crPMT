export interface ObjectDatasetInterface {
    id: number;
    objectId: string;
    recordkeyType: {id: number, name: string};
    recordkeyDetails: string;
    deidentType: {id: number, name: string};
    deidentDirect: boolean;
    deidentHipaa: boolean;
    deidentDates: boolean;
    deidentNonarr: boolean;
    deidentKanon: boolean;
    deidentDetails: string;
    consentType: {id: number, name: string};
    consentNoncommercial: boolean;
    consentGeogRestrict: boolean;
    consentResearchType: boolean;
    consentGeneticOnly: boolean;
    consentNoMethods: boolean;
    consentDetails: string;
    createdOn: string;
}
