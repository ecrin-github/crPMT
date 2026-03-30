export const TIME_UNITS: String[] = ["Hours", "Days", "Weeks", "Months"];

export const EC_TEXT: String = "Ethics Committee";
export const CA_TEXT: String = "Competent Authority";
export const NCA_TEXT: String = "National Competent Authority";
export const REGULATORY_FRAMEWORKS: String[] = ['CTR', 'MDR/IVDR', 'COMBINED', 'OTHER'];
export const STUDY_STATUSES: String[] = [
    "Start-up phase",
    "Running phase: Regulatory & ethical approvals",
    "Running phase: Follow up",
    "Running phase: Organisation of close-out",
    "Completion & termination phase",
    "Completed",
    "Withdrawn",
    "On hold"
];

export enum Levels {
    PROJECT = 1,
    STUDY = 2,
    STUDY_COUNTRY = 3,
    STUDY_CTU = 4
}

export enum AuthorityCodes {
    EC = "EC",
    CA = "CA",
    NCA = "NCA"
}
export enum SafetyNotificationTypeCodes {
    AnnualProgressReport = "ANNUAL",
    CTIS = "CTIS",
    DSUR = "DSUR"
}
export enum VisitTypeCodes {
    SIV = "SIV",
    MOV = "MOV",
    COV = "COV"
}

export enum CtuEvaluationResults {
    SATISFACTORY = "Satisfactory",
    NEEDS_IMPROVEMENT = "Needs Improvement",
    UNSATISFACTORY = "Unsatisfactory"
}

export const ctuEvaluationsListUrl = "https://ecrineu.sharepoint.com/sites/Quality/Lists/CTU%20Evaluations/AllItems.aspx";
export const sasTrackerListUrl = "https://ecrineu.sharepoint.com/sites/Quality/Lists/SAS%20Tracker%20Public/AllItems.aspx";