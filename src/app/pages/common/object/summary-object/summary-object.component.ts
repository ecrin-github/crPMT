import { Component, HostListener, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxPermissionsService } from 'ngx-permissions';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ObjectListEntryInterface } from 'src/app/_rms/interfaces/data-object/data-object-listentry.interface';
import { DataObjectService } from 'src/app/_rms/services/entities/data-object/data-object.service';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { resolvePath } from 'src/assets/js/util';

@Component({
  selector: 'app-summary-object',
  templateUrl: './summary-object.component.html',
  styleUrls: ['./summary-object.component.scss'],
  providers: [ScrollService]
})
export class SummaryObjectComponent implements OnInit {
  // search dropdown filters
  searchColumns = [
    {'value': 'sdOid', 'text': 'Object ID'},
    {'value': 'displayTitle', 'text': 'Title'},
    {'value': 'organisation.defaultName', 'text': 'Organisation'},
    {'value': 'objectType.name', 'text': 'Object Type'},
    {'value': 'accessType.name', 'text': 'Access'},
    {'value': 'linkedStudy.sdSid', 'text': 'Linked Study'},
  ]
  filterColumn: string = 'displayTitle';
  displayedColumns = ['sdOid', 'objectTitle', 'objectOrganisation', 'objectType', 'access', 'linkedStudy', 'actions'];
  usedURLs = ['/', '/browsing', '/data-objects'];
  dataSource: MatTableDataSource<ObjectListEntryInterface>;
  searchText: string = '';
  objectLength: number = 0;
  title: string = '';
  warningModal: any;
  role: any;
  orgId: any;
  isManager: boolean = false;
  isBrowsing: boolean = false;
  deBouncedInputValue = this.searchText;
  searchDebounce: Subject<string> = new Subject();
  sticky: boolean = false;
  notDashboard:boolean = false;
  isOrgIdValid: boolean = false;
  dataChanged: boolean = false;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('objectDeleteModal') objectDeleteModal : TemplateRef<any>;

  constructor(private statesService: StatesService,
              private reuseService: ReuseService,
              private scrollService: ScrollService,
              private listService: ListService, 
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private modalService: NgbModal,
              private dataObjectService: DataObjectService,
              private permissionService: NgxPermissionsService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.role = this.statesService.currentAuthRole;
    this.orgId = this.statesService.currentAuthOrgId;
    this.isOrgIdValid = this.statesService.isOrgIdValid();
    this.isBrowsing = this.router.url.includes('browsing');
    this.isManager = this.statesService.isManager();
    if (!this.isBrowsing) {
      this.permissionService.loadPermissions([this.role]);
    }
    this.notDashboard = this.router.url.includes('data-objects') ? true : false;
    this.getObjectList();
    this.setupSearchDeBouncer();
    this.scrollService.handleScroll(['/data-objects']);

    // Updating data while reusing detached component
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.usedURLs.includes(event.urlAfterRedirects) && this.dataChanged) {
        this.getObjectList();
        this.dataChanged = false;
      }
    });

    this.reuseService.notification$.subscribe((source) => {
      if (this.usedURLs.includes(source) && !this.dataChanged) {
        this.dataChanged = true;
      }
    });
  }

  getSortedObjects(objects) {
    const { compare } = Intl.Collator('en-GB');
    objects.sort((a, b) => {
      if (a.organisation?.id === this.orgId) {
        if (b.organisation?.id === this.orgId) {
          return compare(a.displayTitle, b.displayTitle);
        }
        return -1;
      } else if (b.organisation?.id === this.orgId) {
        return 1;
      } else {
        return compare(a.displayTitle, b.displayTitle);
      }
    });
  }

  getObjectList() {
    this.spinner.show();
    const pageSize = 10000;
    this.listService.getObjectList(pageSize,'').subscribe((res: any) => {
      if (res && res.results) {
        if (this.isOrgIdValid) {
          this.getSortedObjects(res.results);
        }
        this.dataSource = new MatTableDataSource<ObjectListEntryInterface>(res.results);
      } else {
        this.dataSource = new MatTableDataSource();
      }
      this.dataSource.paginator = this.paginator;
      this.filterSearch();
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    });
  } 

  @HostListener('window:storage', ['$event'])
  refreshList(event) {
    console.log('event triggered', event)
    this.getObjectList();
    localStorage.removeItem('updateObjectList');
  }

  deleteRecord(id) {
    const objectInvolvementDtp$ = this.dataObjectService.objectInvolvementDtp(id);
    const objectInvolvementDup$ = this.dataObjectService.objectInvolvementDup(id);
    const combine$ = combineLatest([objectInvolvementDtp$, objectInvolvementDup$]).subscribe(([objectInvolvementDtpRes, objectInvolvementDupRes] : [any, any]) => {
      if (objectInvolvementDtpRes && objectInvolvementDupRes) {
        const dtpLinked = objectInvolvementDtpRes.count;
        const dupLinked = objectInvolvementDupRes.count;
        if (dtpLinked > 0 && dupLinked > 0) {
          this.title = `There are ${dtpLinked} DTPs and ${dupLinked} DUPs linked to this object. Dissociate this object from them to delete it.`;
          this.warningModal = this.modalService.open(this.objectDeleteModal, { size: 'lg', backdrop: 'static' });
        } else if (dtpLinked > 0) {
          this.title = `There are ${dtpLinked} DTPs linked to this object. Dissociate this object from them to delete it.`;
          this.warningModal = this.modalService.open(this.objectDeleteModal, { size: 'lg', backdrop: 'static' });
        } else if (dupLinked > 0) {
          this.title = ` There are ${dupLinked} DUPs linked to this object. Dissociate this object from them to delete it.`;
          this.warningModal = this.modalService.open(this.objectDeleteModal, { size: 'lg', backdrop: 'static' });
        } else {
          const deleteModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
          deleteModal.componentInstance.type = 'dataObject';
          deleteModal.componentInstance.id = id;
          deleteModal.result.then((data: any) => {
            if (data) {
              this.getObjectList();
            }
          }, error => { });
        }
      } else {
        const deleteModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
        deleteModal.componentInstance.type = 'dataObject';
        deleteModal.componentInstance.id = id;
        deleteModal.result.then((data: any) => {
          if (data) {
            this.getObjectList();
          }
        }, error => { });
      }
    }, error => {
      console.log('error', error);
    })
    // this.dataObjectService.objectInvolvement(id).subscribe((res: any) => {
    //   console.log('res', res);
    //   if (res && res.data) {
    //     const dtpLinked = res.data[0].statValue;
    //     const dupLinked = res.data[1].statValue;  
    //     if (dtpLinked > 0 && dupLinked > 0) {
    //       this.title = `There are ${dtpLinked} DTP's and ${dupLinked} DUP's linked to this object. So you can't delete the object`;
    //       this.warningModal = this.modalService.open(this.objectDeleteModal, { size: 'lg', backdrop: 'static' });
    //     } else if (dtpLinked > 0) {
    //       this.title = `There are ${dtpLinked} DTP's linked to this object. So you can't delete the object`;
    //       this.warningModal = this.modalService.open(this.objectDeleteModal, { size: 'lg', backdrop: 'static' });
    //     } else if (dupLinked > 0) {
    //       this.title = ` There are ${dupLinked} DUP's linked to this object. So you can't delete the object`;
    //       this.warningModal = this.modalService.open(this.objectDeleteModal, { size: 'lg', backdrop: 'static' });
    //     } else {
    //       const deleteModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
    //       deleteModal.componentInstance.type = 'dataObject';
    //       deleteModal.componentInstance.id = id;
    //       deleteModal.result.then((data: any) => {
    //         if (data) {
    //           this.getObjectList();
    //         }
    //       }, error => { });
    //     }
    //   } else {
    //     const deleteModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
    //     deleteModal.componentInstance.type = 'dataObject';
    //     deleteModal.componentInstance.id = id;
    //     deleteModal.result.then((data: any) => {
    //       if (data) {
    //         this.getObjectList();
    //       }
    //     }, error => { });
    //   }
    // }, error => {
    //   this.toastr.error(error.error.title);
    // });
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
