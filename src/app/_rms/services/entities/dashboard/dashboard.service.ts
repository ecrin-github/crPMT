import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DashboardResponseInterface,
  DashboardStudyInterface,
  DashboardSubmissionInterface,
} from 'src/app/_rms/interfaces/dashboard/dashboard.interface';
import { environment } from 'src/environments/environment';

const base = environment.baseUrlApi;

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) { }

  // Figures of the dashboard, computed by the back-end
  getDashboard(): Observable<DashboardResponseInterface> {
    return this.http.get<DashboardResponseInterface>(`${base}/core/dashboard`);
  }

  // Studies of a status group of the "Studies by status" chart, e.g. 'Running'
  getDashboardStudies(statusGroup: string): Observable<DashboardStudyInterface[]> {
    // params: added to the URL as ?status_group=..., with special characters (spaces, &) encoded
    return this.http.get<{ studies: DashboardStudyInterface[] }>(`${base}/core/dashboard/studies`, {
      params: { status_group: statusGroup }
    }).pipe(map((res) => res.studies));
  }

  // Submissions of a bar of the "Regulatory submissions" chart: a month ('YYYY-MM') and a series
  getDashboardSubmissions(yearMonth: string, series: 'submitted' | 'approved'): Observable<DashboardSubmissionInterface[]> {
    return this.http.get<{ submissions: DashboardSubmissionInterface[] }>(`${base}/core/dashboard/submissions`, {
      params: { month: yearMonth, series: series }
    }).pipe(map((res) => res.submissions));
  }
}
