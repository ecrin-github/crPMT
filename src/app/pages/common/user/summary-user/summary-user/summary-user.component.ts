import { Component, HostListener, OnInit, OnDestroy, ViewChild, Renderer2 } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxPermissionsService } from 'ngx-permissions';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { ConfirmationWindowComponent } from '../../../confirmation-window/confirmation-window.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { resolvePath } from 'src/assets/js/util';

@Component({
  selector: 'app-summary-user',
  templateUrl: './summary-user.component.html',
  styleUrls: ['./summary-user.component.scss'],
  providers: [ScrollService]
})
export class SummaryUserComponent implements OnInit, OnDestroy {
  usedURLs = ['/', '/people'];
  // search dropdown filters
  searchColumns = [
    { 'value': 'name', 'text': 'Name' },
    { 'value': 'email', 'text': 'Email' },
    { 'value': 'userProfile.organisation.defaultName', 'text': 'Organisation' },
    { 'value': 'role', 'text': 'Role' },
    { 'value': 'isUser', 'text': 'Is user?' },
  ]
  filterColumn: string = 'email';
  displayedColumns = ['userName', 'userEmail', 'userOrganisation', 'userRole', 'isUser', 'actions'];
  dataSource: MatTableDataSource<any>;
  peopleLength: number = 0;
  searchText: string = '';
  orgId: any;
  role: any;
  deBouncedInputValue = this.searchText;
  searchDebounce: Subject<string> = new Subject();
  notDashboard:boolean = false;
  sticky: boolean = false;
  detachedRouteHandlesService: any;
  dataChanged: boolean = false;
  
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  constructor(private statesService: StatesService,
              private reuseService: ReuseService,
              private scrollService: ScrollService, 
              private listService: ListService, 
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private modalService: NgbModal, 
              private permissionService: NgxPermissionsService, 
              private router: Router) { }

  ngOnInit(): void {
    this.permissionService.loadPermissions([this.role]);
    this.notDashboard = this.router.url.includes('people') ? true : false;
    this.getPeople();
    this.setupSearchDeBouncer();
    this.scrollService.handleScroll(['/people']);

    // Updating data while reusing detached component
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.usedURLs.includes(event.urlAfterRedirects) && this.dataChanged) {
        this.getPeople();
        this.dataChanged = false;
      }
    });

    this.reuseService.notification$.subscribe((source) => {
      if (this.usedURLs.includes(source) && !this.dataChanged) {
        this.dataChanged = true;
      }
    });
  }

  getSortedUsers(users) {
    const { compare } = Intl.Collator('en-GB');
    users.sort((a, b) => {
      if (a.userProfile?.organisation?.id === this.orgId) {
        if (b.userProfile?.organisation?.id === this.orgId) {
          return compare(a.lastName, b.lastName);
        }
        return -1;
      } else if (b.userProfile?.organisation?.id === this.orgId) {
        return 1;
      } else {
        return compare(a.lastName, b.lastName);
      }
    });
  }

  getPeople() {
    this.spinner.show();
    const pageSize = 10000;
    this.listService.getPeopleList(pageSize, '').subscribe((res: any) => {
      if (res && res.results) {
        this.getSortedUsers(res.results);
        this.dataSource = new MatTableDataSource<any>(res.results);
      } else {
        this.dataSource = new MatTableDataSource();
      }
      this.dataSource.paginator = this.paginator;
      this.filterSearch();
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    })
  }

  deleteRecord(id) {
    const deleteModal = this.modalService.open(ConfirmationWindowComponent, {size: 'lg', backdrop: 'static'});
    deleteModal.componentInstance.type = 'people';
    deleteModal.componentInstance.peopleId = id;
    deleteModal.result.then((data: any) => {
      if (data) {
        this.getPeople();
      }
    })
  }

  onInputChange(e) {
    this.searchDebounce.next(e.target.value);
  }

  filterSearch() {
    if (this.filterColumn === 'name') {
      this.dataSource.filterPredicate = (data, filter: string) => {
        return filter && (data.firstName + ' ' +  data.lastName).toLocaleLowerCase().includes(filter.toLocaleLowerCase());
      }
    } else if (this.filterColumn === 'role') {
      this.dataSource.filterPredicate = (data, filter: string) => {
        const value = data.userProfile?.lsAaiId ? (data.isSuperuser? 'manager' : 'user') : '';
        return filter && value.includes(filter.toLocaleLowerCase());
      }
    } else if (this.filterColumn === 'isUser') {
      this.dataSource.filterPredicate = (data, filter: string) => {
        const value = data.userProfile?.lsAaiId ? 'yes' : 'no';
        return filter && value.includes(filter.toLocaleLowerCase());
      }
    } else {
      this.dataSource.filterPredicate = (data, filter: string) => {
        return filter && this.filterColumn && resolvePath(data, this.filterColumn)?.toLocaleLowerCase().includes(filter.toLocaleLowerCase());
      }
    }
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

  ngOnDestroy() {
    this.scrollService.unsubscribeScroll();
  }
}
