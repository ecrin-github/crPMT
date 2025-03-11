import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { DtpListEntryInterface } from 'src/app/_rms/interfaces/dtp/dtp-listentry.interface';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { DtpService } from 'src/app/_rms/services/entities/dtp/dtp.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { resolvePath } from 'src/assets/js/util';

@Component({
  selector: 'app-summary-dtp',
  templateUrl: './summary-dtp.component.html',
  styleUrls: ['./summary-dtp.component.scss'],
  providers: [ScrollService]
})

export class SummaryDtpComponent implements OnInit {
  usedURLs = ['/', '/data-transfers'];
  // search dropdown filters
  searchColumns = [
    { 'value': 'id', 'text': 'DTP ID' },
    { 'value': 'displayName', 'text': 'Title' },
    { 'value': 'organisation.defaultName', 'text': 'Organisation' },
    { 'value': 'status.name', 'text': 'Status' },
  ]
  filterColumn: string = 'displayName';
  displayedColumns = ['dtpId', 'dtpTitle', 'dtpOrganisation', 'dtpStatus', 'actions'];
  dataSource: MatTableDataSource<DtpListEntryInterface>;
  searchText: string = '';
  dtpLength: number = 0;
  warningModal: any;
  orgId: any;
  role: any;
  deBouncedInputValue = this.searchText;
  searchDebounce: Subject<string> = new Subject();
  sticky: boolean = false;
  notDashboard: boolean = false;
  dataChanged: boolean = false;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('exampleModal') exampleModal: TemplateRef<any>;

  constructor(private statesService: StatesService,
    private reuseService: ReuseService,
    private scrollService: ScrollService,
    private listService: ListService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private dtpService: DtpService,
    private permissionService: NgxPermissionsService,
    private router: Router) { }

  ngOnInit() {
    this.role = this.statesService.currentAuthRole;
    this.permissionService.loadPermissions([this.role]);
    this.orgId = this.statesService.currentAuthOrgId;
    this.notDashboard = this.router.url.includes('data-transfers') ? true : false;
    this.getDtpList();
    this.setupSearchDeBouncer();
    this.scrollService.handleScroll(['/data-transfers']);

    // Updating data while reusing detached component
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.usedURLs.includes(event.urlAfterRedirects) && this.dataChanged) {
        this.getDtpList();
        this.dataChanged = false;
      }
    });

    this.reuseService.notification$.subscribe((source) => {
      if (this.usedURLs.includes(source) && !this.dataChanged) {
        this.dataChanged = true;
      }
    });
  }

  getSortedDTPs(dtps) {
    const { compare } = Intl.Collator('en-GB');
    dtps.sort((a, b) => {
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

  getDtpList() {
    this.spinner.show();
    const pageSize = 10000;
    this.listService.getDtpList(pageSize, '').subscribe((res: any) => {
      if (res && res.results) {
        this.getSortedDTPs(res.results);
        this.dataSource = new MatTableDataSource<DtpListEntryInterface>(res.results);
      } else {
        this.dataSource = new MatTableDataSource();
      }
      this.dataSource.paginator = this.paginator;
      this.filterSearch();
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title)
    });
  }

  @HostListener('window:storage', ['$event'])
  refreshList(event) {
    console.log('event triggered', event)
    this.getDtpList();
    localStorage.removeItem('updateDtpList');
  }

  deleteRecord(id) {
    this.dtpService.getDtpById(id).subscribe((res: any) => {
      if (res) {
        if (res.status?.id === 'd28ae345-8ee6-4997-b989-f871f79f3ce9' || res.status?.id === '1e87d5ce-1f95-49ca-98b7-44418f1fc5aa' || res.status?.id === 'a1e891ef-3d88-4884-851a-d2c7b098b68f') {
          this.warningModal = this.modalService.open(this.exampleModal, { size: 'lg', backdrop: 'static' });
        } else {
          const deleteModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
          deleteModal.componentInstance.type = 'dtp';
          deleteModal.componentInstance.id = id;
          deleteModal.result.then((data: any) => {
            if (data) {
              this.getDtpList();
            }
          }, error => { });
        }
      }
    }, error => { })
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
