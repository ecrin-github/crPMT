// Data of the dashboard on the internal main page

// ---- Response of GET core/dashboard, as sent by the back-end ----

export interface DashboardResponseInterface {
    studiesByStatus: { name: string; value: number }[];                            // Every status group, even with 0 studies
    submissionsByMonth: { month: string; submitted: number; approved: number }[];  // month: 'YYYY-MM', oldest first
    upcomingDeadlines: { title: string; details: string; date: string }[];         // date: 'YYYY-MM-DD', closest first
}

/** One study of GET core/dashboard/studies?status_group=..., listed when clicking on the "Studies by status" chart */
export interface DashboardStudyInterface {
    id: number;
    shortTitle: string;
    status: string;                                    // Exact status, e.g. 'Running phase: Follow up'
    project: { id: number; shortName: string } | null;
}

/** One submission of GET core/dashboard/submissions?month=...&series=..., listed when clicking on a bar */
export interface DashboardSubmissionInterface {
    id: number;
    date: string;                // 'YYYY-MM-DD': submission date for "submitted", approval date for "approved"
    type: string;                // 'Initial submission', 'Amendment' or 'Other notification'
    authority: string | null;    // e.g. 'EC'
    country: string | null;
    study: { id: number; shortTitle: string } | null;
    project: { id: number; shortName: string } | null;
}

// ---- Data as displayed by the dashboard ----

/** One slice of the "Studies by status" donut */
export interface DashboardStatusInterface {
    name: string;    // Status group, e.g. 'Running'
    value: number;   // Number of studies
    color: string;   // Colour of the slice and of its legend dot
}

/** One month of the "Regulatory submissions" chart */
export interface DashboardSubmissionsMonthInterface {
    month: string;      // Short month label, e.g. 'Jun'
    yearMonth: string;  // 'YYYY-MM', sent back to the back-end to list the submissions of a bar
    submitted: number;
    approved: number;
}

/** One item of the "Upcoming deadlines" list */
export interface DashboardDeadlineInterface {
    title: string;      // e.g. 'Reporting period'
    details: string;    // e.g. study and country concerned
    date: Date;
    dueSoon: boolean;   // Shows the "Due soon" badge
}
