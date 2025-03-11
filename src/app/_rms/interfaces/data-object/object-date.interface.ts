export interface ObjectDateInterface {
    id: number;
    sdOid: string;
    dateTypeId: number;
    isDateRange: boolean;
    dateAsString: string;
    startYear: number;
    startMonth: number;
    startDay: number;
    endYear: number;
    endMonth: number;
    endDay: number;
    details: string;
    createdOn: string;
}
