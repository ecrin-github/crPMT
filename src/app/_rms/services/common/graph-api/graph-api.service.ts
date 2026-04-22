import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GraphApiService {
  // TODO: this class needs typing
  // https://learn.microsoft.com/en-us/graph/api/listitem-list?view=graph-rest-1.0&tabs=http

  public SITE_NAME_QUALITY = "Quality";
  public CTU_EVALUATIONS_GUID = "d4cb819a-40b0-4adc-ad14-9aafd4bd5c9d";
  public CTU_SERVICE_PROVIDERS_GUID = "7C480809-EDA4-4773-936B-0FE9C6284EDE";                                                        

  private ctuEvaluationsQueryStarted: boolean = false;
  // Stores CTU Evaluations data
  public _ctuEvaluationsData$: BehaviorSubject<Object> = new BehaviorSubject<Object>(null);
  // Triggers graph API query on first subscription, for subsequent subscription use stored data
  public ctuEvaluations$ = new Observable<Object | null>(subscriber => {
    if (!this.ctuEvaluationsQueryStarted && this._ctuEvaluationsData$.value === null) {
      this.ctuEvaluationsQueryStarted = true; // Avoid race condition
      this.getCTUEvaluations().subscribe((res: Object) => {
        this.setCTUEvaluationsData(res);
      });
    }
    // const sub = this._ctuEvaluationsData$.subscribe({
    //   next: v => subscriber.next(v),
    //   error: err => subscriber.error(err),
    //   complete: () => subscriber.complete()
    // });
    // Filter ensures subscriber only gets query result
    const sub = this._ctuEvaluationsData$.pipe(filter(v => v !== null)).subscribe(subscriber);

    return () => sub.unsubscribe();   // Somehow unsubscribe to ctuEvaluationsData$ when calling unsubscribe on ctuEvaluations$
  });

  private sasTrackerQueryStarted: boolean = false;
  public _sasTrackerData$: BehaviorSubject<Object> = new BehaviorSubject<Object>(null);

  public sasTracker$ = new Observable<Object | null>(subscriber => {
    if (!this.sasTrackerQueryStarted && this._sasTrackerData$.value === null) {
      this.sasTrackerQueryStarted = true;
      this.getSASTracker().subscribe((res: Object) => {
        this.setSASTrackerData(res);
      });
    }

    const sub = this._sasTrackerData$.pipe(filter(v => v !== null)).subscribe(subscriber);
    return () => sub.unsubscribe();
  });

  constructor(
    private http: HttpClient,
  ) {
  }


  
  // TODO: should cache site id for multiple request to the same site
  getFullSiteId(siteName): Observable<Object> {
    return this.http.get(`https://graph.microsoft.com/v1.0/sites/${environment.sharepointHostname}:/sites/${siteName}?$select=id`);
  }

  getCTUEvaluations(): Observable<Object> {
    return this.getFullSiteId(this.SITE_NAME_QUALITY).pipe(
      mergeMap((res: any) => {
        if (res?.id) {
          return this.http.get(`https://graph.microsoft.com/v1.0/sites/${res.id}/lists/{${this.CTU_EVALUATIONS_GUID}}/items?expand=fields($select=ProjectLookupId,Project,CTULookupId,CTU,Created,Result)`);
        }
      })
    );
  }

  getSASTracker(): Observable<Object> {
    return this.getFullSiteId(this.SITE_NAME_QUALITY).pipe(
      mergeMap((res: any) => {
        if (res?.id) {
          return this.http.get(
            `https://graph.microsoft.com/v1.0/sites/${res.id}/lists/{${this.SAS_TRACKER_GUID}}/items?expand=fields($select=Title,Short_x0020_Name,Status)`
          );
        }
        return of(null);
      })
    );
  }

  setCTUEvaluationsData(res: any): void {
    if (res?.value?.length > 0) { // TODO: handle failures
      let ctuEvaluations = {};

      res.value.forEach((v: any) => {
        if (v?.fields?.Project) {
          const projectShortName = v.fields.Project.toLowerCase().trim();
          if (!ctuEvaluations.hasOwnProperty(projectShortName)) {
            ctuEvaluations[projectShortName] = [v.fields];
          } else {
            ctuEvaluations[projectShortName].push(v.fields);
          }
        }
      });

      this._ctuEvaluationsData$.next(ctuEvaluations);
    }
  }

  setSASTrackerData(res: any): void {
    let sasTracker = {};

    if (res?.value?.length > 0) {
      res.value.forEach((item: any) => {
        const shortName = item?.fields?.Short_x0020_Name?.toLowerCase()?.trim();
        const title = item?.fields?.Title?.toLowerCase()?.trim();

        const key = shortName || title;

        if (key) {
          if (!sasTracker.hasOwnProperty(key)) {
            sasTracker[key] = [item.fields];
          } else {
            sasTracker[key].push(item.fields);
          }
        }
      });
    }

    this._sasTrackerData$.next(sasTracker);
  }

  // getCTUEvaluationData(projectShortName: string, ctuShortName: string) {
  //   return this.ctuEvaluations$.pipe(
  //     mergeMap((ctuEvaluations: Object) => {
  //       let retArr: [] = [];

  //       if (ctuEvaluations && projectShortName && ctuShortName) {
  //         projectShortName = projectShortName.toLowerCase().trim();
  //         ctuShortName = ctuShortName.toLowerCase().trim();
  //         if (ctuEvaluations.hasOwnProperty(projectShortName)) {
  //           retArr = ctuEvaluations[projectShortName].filter((fields) => fields?.CTU?.toLowerCase() === ctuShortName);
  //         }
  //       }
  //       return of(retArr);
  //     })
  //   )
  // }
  private ctuServiceProvidersQueryStarted: boolean = false;
  public _ctusServiceProvidersData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(null);

  public ctusServiceProviders$ = new Observable<any[]>(subscriber => {
    if (!this.ctuServiceProvidersQueryStarted && this._ctusServiceProvidersData$.value === null) {
      this.ctuServiceProvidersQueryStarted = true;
      this.getCTUsServiceProviders().subscribe((res: any) => {
        this.setCTUsServiceProvidersData(res);
      });
    }

    const sub = this._ctusServiceProvidersData$
      .pipe(filter(v => v !== null))
      .subscribe(subscriber);

    return () => sub.unsubscribe();
  });
  getCTUsServiceProviders(): Observable<any> {
    return this.getFullSiteId(this.SITE_NAME_QUALITY).pipe(
      mergeMap((res: any) => {
        if (res?.id) {
          return this.http.get(
            `https://graph.microsoft.com/v1.0/sites/${res.id}/lists/{${this.CTU_SERVICE_PROVIDERS_GUID}}/items?$expand=fields($select=Title,Short_x0020_Name,Country,SAS_x0020_Verification,Address)`
          );
        }
        return of(null);
      })
    );
  }
  
  setCTUsServiceProvidersData(res: any): void {
    let ctus: any[] = [];

    if (res?.value?.length > 0) {
      ctus = res.value
        .map((item: any) => {
          const fields = item?.fields || {};

          return {
            id: null,
            sharepointItemId: item?.id || null,
            shortName: fields?.Short_x0020_Name || '',
            name: fields?.Title || '',
            sasVerification: !!fields?.SAS_x0020_Verification,
            addressInfo: fields?.Address || null,
            country: {
              iso2: fields?.Country || null,
              name: fields?.Country || null
            },
            source: 'sharepoint'
          };
        })
        .filter((ctu: any) => ctu.shortName || ctu.name);
    }

    this._ctusServiceProvidersData$.next(ctus);
  }

  downloadCtusServiceProvidersCsv(): void {
    this.ctusServiceProviders$.subscribe((ctus: any[]) => {
      if (!ctus || ctus.length === 0) {
        console.warn('No CTUs to export');
        return;
      }

      const rows = ctus.map((ctu: any) => ({
        sharepoint_item_id: ctu.sharepointItemId || '',
        short_name: ctu.shortName || '',
        name: ctu.name || '',
        country_iso2: ctu.country?.iso2 || '',
        country_name: ctu.country?.name || '',
        source: ctu.source || ''
      }));

      const csv = this.convertToCsv(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'ctus_service_providers_with_ids.csv';
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }

  private convertToCsv(rows: any[]): string {
    if (!rows || rows.length === 0) {
      return '';
    }

    const headers = Object.keys(rows[0]);

    const escapeCsvValue = (value: any): string => {
      const stringValue = value == null ? '' : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const lines = [
      headers.join(','),
      ...rows.map(row => headers.map(header => escapeCsvValue(row[header])).join(','))
    ];

    return lines.join('\n');
  }
}
