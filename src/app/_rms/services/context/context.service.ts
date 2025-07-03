import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CountryInterface } from '../../interfaces/context/country.interface';
import { CTUInterface } from '../../interfaces/context/ctu.interface';
import { FundingSourceInterface } from '../../interfaces/context/funding-source.interface';
import { ServiceInterface } from '../../interfaces/context/service.interface';

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  public countries: BehaviorSubject<CountryInterface[]> =
        new BehaviorSubject<CountryInterface[]>(null);
  public ctus: BehaviorSubject<CTUInterface[]> =
        new BehaviorSubject<CTUInterface[]>(null);
  public fundingSources: BehaviorSubject<FundingSourceInterface[]> =
        new BehaviorSubject<FundingSourceInterface[]>(null);
  public services: BehaviorSubject<ServiceInterface[]> =
        new BehaviorSubject<ServiceInterface[]>(null);

  constructor(
    private http: HttpClient,
    private toastr: ToastrService) {
    // Note: be careful if you add new observables because of the way their result is retrieved later (combineLatest + pop)
    // The code is built like this because in the version of RxJS used here combineLatest does not handle dictionaries
    let queryFuncs: Array<Observable<any>> = [];

    queryFuncs.push(this.getCountries());
    queryFuncs.push(this.getCTUs());
    queryFuncs.push(this.getServices());
    queryFuncs.push(this.getFundingSources());

    let obsArr: Array<Observable<any>> = [];
    queryFuncs.forEach((funct) => {
      obsArr.push(funct.pipe(catchError(error => of(this.toastr.error(error.error.title)))));
    });

    combineLatest(obsArr).subscribe(res => {
      this.setFundingSources(res.pop());
      this.setServices(res.pop());
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

  getServices() {
    return this.http.get(`${environment.baseUrlApi}/context/services`);
  }

  setServices(services) {
    this.services.next(services);
  }

  getFundingSources() {
    return this.http.get(`${environment.baseUrlApi}/context/funding-sources`);
  }

  setFundingSources(fundingSources) {
    this.fundingSources.next(fundingSources);
  }

  updateFundingSources() {
    console.log("update funding sources");
    this.getFundingSources().subscribe((fs) => {
      console.log(`update funding sources: ${JSON.stringify(fs)}`)
      this.setFundingSources(fs);
    });
  }

  addFundingSource(payload) {
    return this.http.post(`${environment.baseUrlApi}/context/funding-sources`, payload);
  }

  deleteFundingSource(id) {
    return this.http.delete(`${environment.baseUrlApi}/context/funding-sources/${id}`, {observe: "response", responseType: 'json'});
  }
}
