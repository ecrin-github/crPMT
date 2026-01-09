import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { ContextService } from 'src/app/_rms/services/context/context.service';
import { PersonModalComponent } from '../../person-modal/person-modal.component';

@Component({
  selector: 'app-person-list',
  templateUrl: './person-list.component.html',
  styleUrls: ['./person-list.component.scss']
})
export class PersonListComponent implements OnInit {
  displayedColumns = ['personName', 'personEmail', 'personPosition', 'personCountry', 'personIsEuCo', 'actions'];
  dataSource: MatTableDataSource<any>;
  searchText: string = '';
  personsLength: number = 0;
  deBouncedInputValue = this.searchText;
  searchDebounce: Subject<string> = new Subject();
  detachedRouteHandlesService: any;
  dataChanged: boolean = false;
  
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  constructor(private statesService: StatesService,
              private contextService: ContextService, 
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private modalService: NgbModal, 
              private router: Router) { }

  ngOnInit(): void {
    this.getPersons();
    this.setupSearchDeBouncer();
  }

  getSortedPersons(persons) {
    const { compare } = Intl.Collator('en-GB');
    persons.sort((a, b) => {
      if (a.isEuco && !b.isEuco) {
        return -1;
      } else if (!a.isEuco && b.isEuco) {
        return 1;
      } else {
        return compare(a.fullName, b.fullName);
      }
    });
  }

  getPersons() {
    this.spinner.show();
    this.contextService.getPersons().subscribe((res: any) => {
      if (res?.length > 0) {
        this.getSortedPersons(res);
        this.dataSource = new MatTableDataSource<any>(res);
        this.personsLength = res.length;
      } else {
        this.dataSource = new MatTableDataSource();
        this.personsLength = 0;
      }
      this.dataSource.paginator = this.paginator;
      this.filterSearch();
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    });
  }

  addPerson() {
    const personModal = this.modalService.open(PersonModalComponent, { size: 'lg', backdrop: 'static' });

    personModal.result.then((result) => {
      this.spinner.show();

      if (result != null) {
        this.contextService.addPerson(result).subscribe(() => {
          this.getPersons();
        }),
        catchError((err) => {
          this.toastr.error(err, "Error adding person", { timeOut: 20000, extendedTimeOut: 20000 });
          this.spinner.hide();
          return of(null);
        });
      } else {
        this.spinner.hide();
      }
    });
  }

  editPerson(person) {
    const personModal = this.modalService.open(PersonModalComponent, { size: 'lg', backdrop: 'static' });
    personModal.componentInstance.isAdd = false;
    personModal.componentInstance.loadPerson(person);

    personModal.result.then((result) => {
      this.spinner.show();

      if (result != null) {
        this.contextService.editPerson(person.id, result).subscribe(() => {
          this.getPersons();
        }),
        catchError((err) => {
          this.toastr.error(err, "Error adding person", { timeOut: 20000, extendedTimeOut: 20000 });
          this.spinner.hide();
          return of(null);
        });
      } else {
        this.spinner.hide();
      }
    });
  }

  deletePerson(id) {
    const deleteModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
    deleteModal.componentInstance.itemType = 'person';
    deleteModal.result.then((_delete: boolean) => {
      if (_delete) {
        this.spinner.show();
        this.contextService.deletePerson(id).subscribe((res: any) => {
          if (res.status === 204) {
            this.toastr.success('Person deleted successfully');
            this.getPersons();
          } else {
            this.toastr.error('Error when deleting person', res.statusText);
            this.spinner.hide();
          }
        }, error => {
          this.toastr.error(error.error.title);
          this.spinner.hide();
        });
      }
    }, error => {
      this.toastr.error(error);
      this.spinner.hide();
    });
  }

  onInputChange(e) {
    this.searchDebounce.next(e.target.value);
  }

  filterSearch() {
    // TODO: override to be able to search "true" for isEuco? + country
    this.dataSource.filter = this.searchText;
  }

  setupSearchDeBouncer() {
    const search$ = this.searchDebounce.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe((term: string) => {
      this.deBouncedInputValue = term;
      this.filterSearch();
    });
  }
}
