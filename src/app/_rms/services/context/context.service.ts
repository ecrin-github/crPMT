import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { StudyCountryInterface } from '../../interfaces/study/study-country.interface';
import { StudyCTUInterface } from '../../interfaces/study/study-ctus.interface';
import { CountryInterface } from '../../interfaces/context/country.interface';
import { CTUInterface } from '../../interfaces/context/ctu.interface';

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  public countries: BehaviorSubject<CountryInterface[]> =
        new BehaviorSubject<CountryInterface[]>(null);
  public ctus: BehaviorSubject<CTUInterface[]> =
        new BehaviorSubject<CTUInterface[]>(null);

  constructor(
    private http: HttpClient,
    private toastr: ToastrService) {
    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries
    let queryFuncs: Array<Observable<any>> = [];

    queryFuncs.push(this.getCountries());
    queryFuncs.push(this.getCTUs());

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error.error.title)))));
    });

    combineLatest(obsArr).subscribe(res => {
      this.setCTUs(res.pop());
      this.setCountries(res.pop());
    });
  }

  getCountries() {
    return this.http.get(`${environment.baseUrlApi}/context/countries`);
  }

  sortCountries(countries) {
    const { compare } = Intl.Collator('en-GB');
    countries.sort((a, b) => { return compare(a.name, b.name); });
  }

  setCountries(countries) {
    this.sortCountries(countries);
    this.countries.next(countries);
  }
  
  getCTUs() {
    return this.http.get(`${environment.baseUrlApi}/context/ctus`);
  }
  
  setCTUs(ctus) {
    this.ctus.next(ctus);
  }
}
