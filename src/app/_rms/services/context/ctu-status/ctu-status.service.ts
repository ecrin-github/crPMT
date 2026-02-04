import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ClassValueInterface } from 'src/app/_rms/interfaces/context/class-value.interface';
import { environment } from 'src/environments/environment';
import { CommonApiService } from '../../common/common-api/common-api.service';
import { sortClassValues } from 'src/assets/js/util';

@Injectable({
  providedIn: 'root'
})
export class CtuStatusService {
  public ctuStatuses: BehaviorSubject<ClassValueInterface[]> =
    new BehaviorSubject<ClassValueInterface[]>(null);

  constructor(
    private commonApiService: CommonApiService,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService) {
    this.getCTUStatuses().subscribe((ctuStatuses: ClassValueInterface[]) => this.setCTUStatuses(ctuStatuses));
  }

  getCTUStatuses() {
    return this.http.get(`${environment.baseUrlApi}/context/ctu-statuses`);
  }

  setCTUStatuses(ctuStatuses) {
    sortClassValues(ctuStatuses);
    this.ctuStatuses.next(ctuStatuses);
  }

  addCTUStatus(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/ctu-statuses`, payload);
  }

  deleteCTUStatus(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/ctu-statuses/${id}`, { observe: "response", responseType: 'json' });
  }

  updateCTUStatuses() {
    return this.getCTUStatuses().pipe(
      map((ctuStatuses) => {
        this.setCTUStatuses(ctuStatuses);
      })
    );
  }

  /**
   * TODO
   * @param value 
   * @returns 
   * TODO: should be generic to class values
   */
  addCTUStatusDropdown(value) {
    let ctuStatus = { "id": "", "value": "" };
    this.spinner.show();

    return this.addCTUStatus({ 'value': value }).pipe(
      mergeMap((c: any) => {
        ctuStatus.id = c.id;
        ctuStatus.value = c.value;
        return this.updateCTUStatuses();
      }),
      mergeMap(() => {
        this.spinner.hide();
        return of(ctuStatus);
      }),
      catchError((err) => {
        this.toastr.error(err, "Error adding CTU status", { timeOut: 20000, extendedTimeOut: 20000 });
        return of(null);
      })
    ).toPromise();
  }

  /**
   * TODO
   * @param ctuStatusToRemove 
   * @param filter 
   * TODO: should be generic
   */
  deleteCTUStatusDropdown(ctuStatusToRemove, filter) {
    this.spinner.show();
    // Checking if other projects have this item
    this.commonApiService.getReferenceCountByClass("ctustatus", ctuStatusToRemove.id).subscribe((res: any) => {
      let refCount = res.totalCount;
      // Allowing deletion if item has already been added and is only referenced once by the calling class
      if (filter) { // !isAdd
        refCount -= 1;
      }

      if (refCount > 0) {
        this.toastr.error(`Failed to delete this CTU status as it is used in ${refCount} other objects (projects, studies, etc.)`);
        this.spinner.hide();
      } else {
        // Delete from the DB, then locally if succeeded
        this.deleteCTUStatus(ctuStatusToRemove.id).subscribe((res: any) => {
          if (res.status !== 204) {
            this.toastr.error('Error when deleting CTU status', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
            this.spinner.hide();
          } else {
            this.updateCTUStatuses().subscribe(() => {
              this.spinner.hide();
            });
          }
        }, error => {
          this.toastr.error(error);
          this.spinner.hide();
        });
      }
    }, error => {
      this.toastr.error(error);
      this.spinner.hide();
    });
  }
}
