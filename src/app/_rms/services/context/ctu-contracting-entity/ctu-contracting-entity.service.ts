import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ClassValueInterface } from 'src/app/_rms/interfaces/context/class-value.interface';
import { environment } from 'src/environments/environment';
import { sortClassValues } from 'src/assets/js/util';

// Read-only: the list is fixed for now (see crPMT-BE context/migrations/0026_seed_ctu_contracting_entities.py),
// only editable via the admin/DB, not through the app
@Injectable({
  providedIn: 'root'
})
export class CtuContractingEntityService {
  public ctuContractingEntities: BehaviorSubject<ClassValueInterface[]> =
    new BehaviorSubject<ClassValueInterface[]>(null);

  constructor(private http: HttpClient) {
    this.getCtuContractingEntities().subscribe((ctuContractingEntities: ClassValueInterface[]) => this.setCtuContractingEntities(ctuContractingEntities));
  }

  getCtuContractingEntities() {
    return this.http.get(`${environment.baseUrlApi}/context/ctu-contracting-entities`);
  }

  setCtuContractingEntities(ctuContractingEntities) {
    sortClassValues(ctuContractingEntities);
    // "Other" is a catch-all and should always be the last option, regardless of alphabetical order
    const otherIndex = ctuContractingEntities?.findIndex((e) => e.value === 'Other') ?? -1;
    if (otherIndex > -1) {
      const [other] = ctuContractingEntities.splice(otherIndex, 1);
      ctuContractingEntities.push(other);
    }
    this.ctuContractingEntities.next(ctuContractingEntities);
  }
}
