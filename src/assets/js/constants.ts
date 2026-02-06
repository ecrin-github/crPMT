export const TIME_UNITS: String[] = ["Hours", "Days", "Weeks", "Months"];

export const EC_TEXT: String = "Ethics Committee";
export const CA_TEXT: String = "Competent Authority";
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

export enum AuthorityCodes {
    EC = "EC",
    CA = "CA"
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