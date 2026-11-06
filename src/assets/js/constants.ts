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

// User satisfaction survey (specs L2): sent after the submission phase, then every 2 years, and at the end of the project
export const SATISFACTION_SURVEY_TYPES = {
    INITIAL: "Initial survey",
    FOLLOW_UP: "Follow-up survey",
    END_OF_PROJECT: "End of project survey"
};
export const SATISFACTION_SURVEY_INTERVAL_MONTHS: number = 24;

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
export enum SasVerificationResults {
    APPROVED = "Approved",
    NOT_APPROVED = "Not approved"
}

export const ctuEvaluationsListUrl = "https://ecrineu.sharepoint.com/sites/Quality/Lists/CTU%20Evaluations/AllItems.aspx";
export const sasTrackerListUrl = "https://ecrineu.sharepoint.com/sites/Quality/Lists/SAS%20Tracker%20Public/AllItems.aspx";
