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
export class CtuContractingEntityService {
  public ctuContractingEntities: BehaviorSubject<ClassValueInterface[]> =
    new BehaviorSubject<ClassValueInterface[]>(null);

  constructor(
    private commonApiService: CommonApiService,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService) {
    this.getCtuContractingEntities().subscribe((ctuContractingEntities: ClassValueInterface[]) => this.setCtuContractingEntities(ctuContractingEntities));
  }

  getCtuContractingEntities() {
    return this.http.get(`${environment.baseUrlApi}/context/ctu-contracting-entities`);
  }

  setCtuContractingEntities(ctuContractingEntities) {
    sortClassValues(ctuContractingEntities);
    this.ctuContractingEntities.next(ctuContractingEntities);
  }

  addCtuContractingEntity(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/ctu-contracting-entities`, payload);
  }

  deleteCtuContractingEntity(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/ctu-contracting-entities/${id}`, { observe: "response", responseType: 'json' });
  }

  updateCtuContractingEntities() {
    return this.getCtuContractingEntities().pipe(
      map((ctuContractingEntities) => {
        this.setCtuContractingEntities(ctuContractingEntities);
      })
    );
  }

  addCtuContractingEntityDropdown(value) {
    let ece = { "id": "", "value": "" };
    this.spinner.show();

    return this.addCtuContractingEntity({ 'value': value }).pipe(
      mergeMap((c: any) => {
        ece.id = c.id;
        ece.value = c.value;
        return this.updateCtuContractingEntities();
      }),
      mergeMap(() => {
        this.spinner.hide();
        return of(ece);
      }),
      catchError((err) => {
        this.spinner.hide();
        this.toastr.error(err, "Error adding CTU contracting entity", { timeOut: 20000, extendedTimeOut: 20000 });
        return of(null);
      })
    ).toPromise();
  }

  deleteCtuContractingEntityDropdown(ctuContractingEntityToRemove, filter) {
    this.spinner.show();
    // Checking if other objects have this item
    this.commonApiService.getReferenceCountByClass("ctucontractingentity", ctuContractingEntityToRemove.id).subscribe((res: any) => {
      let refCount = res.totalCount;
      // Allowing deletion if item has already been added and is only referenced once by the calling class
      if (filter) { // !isAdd
        refCount -= 1;
      }

      if (refCount > 0) {
        this.toastr.error(`Failed to delete this CTU contracting entity as it is used in ${refCount} other objects (projects, studies, etc.)`);
        this.spinner.hide();
      } else {
        // Delete from the DB, then locally if succeeded
        this.deleteCtuContractingEntity(ctuContractingEntityToRemove.id).subscribe((res: any) => {
          if (res.status !== 204) {
            this.toastr.error('Error when deleting CTU contracting entity', res.error, { timeOut: 20000, extendedTimeOut: 20000 });
            this.spinner.hide();
          } else {
            this.updateCtuContractingEntities().subscribe(() => {
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
