export interface ApiResponseInterface<T> {
    total: number;
    size: number | null;
    page: number | null;
    status: number;
    messages: string[];
    data: T[];
}
