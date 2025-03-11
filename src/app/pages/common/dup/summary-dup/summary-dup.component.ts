import { Component, HostListener, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { DupListEntryInterface } from 'src/app/_rms/interfaces/dup/dup-listentry.interface';
import { DupService } from 'src/app/_rms/services/entities/dup/dup.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { resolvePath } from 'src/assets/js/util';

@Component({
  selector: 'app-summary-dup',
  templateUrl: './summary-dup.component.html',
  styleUrls: ['./summary-dup.component.scss'],
  providers: [ScrollService]
})
export class SummaryDupComponent implements OnInit {
  usedURLs = ['/', '/data-use'];
  // search dropdown filters
  searchColumns = [
    { 'value': 'id', 'text': 'DUP ID' },
    { 'value': 'displayName', 'text': 'Title' },
    { 'value': 'organisation.defaultName', 'text': 'Organisation' },
    { 'value': 'status.name', 'text': 'Status' },
  ]
  filterColumn: string = 'displayName';
  displayedColumns = ['dupId', 'dupTitle', 'dupOrganisation', 'dupStatus', 'actions'];
  dataSource: MatTableDataSource<DupListEntryInterface>;
  searchText: string = '';
  dupLength: number = 0;
  warningModal: any;
  orgId: any;
  role: any;
  deBouncedInputValue = this.searchText;
  searchDebounce: Subject<string> = new Subject();
  sticky: boolean = false;
  notDashboard: boolean = false;
  dataChanged: boolean = false;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('deleteModal') deleteModal : TemplateRef<any>;

  constructor(private statesService: StatesService,
              private reuseService: ReuseService,
              private scrollService: ScrollService,
              private listService: ListService, 
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private modalService: NgbModal,
              private dupService: DupService,
              private permissionService: NgxPermissionsService, private router: Router) { }

  ngOnInit() {
    this.role = this.statesService.currentAuthRole;
    this.permissionService.loadPermissions([this.role]);
    this.orgId = this.statesService.currentAuthOrgId;
    this.notDashboard = this.router.url.includes('data-use') ? true : false;
    this.getDupList();
    this.setupSearchDeBouncer();
    this.scrollService.handleScroll(['/data-use']);

    // Updating data while reusing detached component
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.usedURLs.includes(event.urlAfterRedirects) && this.dataChanged) {
        this.getDupList();
        this.dataChanged = false;
      }
    });

    this.reuseService.notification$.subscribe((source) => {
      if (this.usedURLs.includes(source) && !this.dataChanged) {
        this.dataChanged = true;
      }
    });
  }

  getSortedDUPs(dups) {
    const { compare } = Intl.Collator('en-GB');
    dups.sort((a, b) => {
      if (a.organisation?.id === this.orgId) {
        if (b.organisation?.id === this.orgId) {
          return compare(a.displayName, b.displayName);
        }
        return -1;
      } else if (b.organisation?.id === this.orgId) {
        return 1;
      } else {
        return compare(a.displayName, b.displayName);
      }
    });
  }

  getDupList() {
    this.spinner.show();
    const pageSize = 10000;
    this.listService.getDupList(pageSize, '').subscribe((res: any) => {
      if (res && res.results) {
        this.getSortedDUPs(res.results);
        this.dataSource = new MatTableDataSource<DupListEntryInterface>(res.results);
      } else {
        this.dataSource = new MatTableDataSource();
      }
      this.dataSource.paginator = this.paginator;
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    });
  }
  
  @HostListener('window:storage', ['$event'])
  refreshList(event) {
    console.log('event triggered', event)
    this.getDupList();
    localStorage.removeItem('updateDupList');
  }

  deleteRecord(id) {
    this.dupService.getDupById(id).subscribe((res: any) => {
      if (res) {
        if (res.status?.id === '5f7846ba-0627-49f7-acf6-9b362db5af1b' || res.status?.id === '16f2eb8a-9694-46c9-830e-b961e3371500') {
          this.warningModal = this.modalService.open(this.deleteModal, {size: 'lg', backdrop: 'static'});
        } else {
          const deleteModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
          deleteModal.componentInstance.type = 'dup';
          deleteModal.componentInstance.id = id;
          deleteModal.result.then((data: any) => {
            if (data) {
              this.getDupList();
            }
          }, error => { });
        }
      }
    })
  }

  closeModal() {
    this.warningModal.close();
  }

  onInputChange(e) {
    this.searchDebounce.next(e.target.value);
  }

  filterSearch() {
    this.dataSource.filterPredicate = (data, filter: string) => {
      return filter && this.filterColumn && resolvePath(data, this.filterColumn)?.toLocaleLowerCase().includes(filter.toLocaleLowerCase());
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
