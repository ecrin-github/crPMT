import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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

  // getCTUEvaluationData(projectShortName: string, ctuShortName: string) {
  //   return this.ctuEvaluations$.pipe(
  //     mergeMap((ctuEvaluations: Object) => {
  //       console.log("hello")
  //       console.log(projectShortName)
  //       console.log(ctuShortName)
  //       let retArr: [] = [];

  //       if (ctuEvaluations && projectShortName && ctuShortName) {
  //         console.log("first yes");
  //         projectShortName = projectShortName.toLowerCase().trim();
  //         ctuShortName = ctuShortName.toLowerCase().trim();
  //         if (ctuEvaluations.hasOwnProperty(projectShortName)) {
  //           console.log("second yes");
  //           retArr = ctuEvaluations[projectShortName].filter((fields) => fields?.CTU?.toLowerCase() === ctuShortName);
  //         }
  //       }

  //       return of(retArr);
  //     })
  //   )
  // }
}
