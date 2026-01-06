import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { StudyListEntryInterface } from 'src/app/_rms/interfaces/study/study-listentry.interface';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { Subject, combineLatest, fromEvent } from 'rxjs';
import { NgxPermissionsService } from 'ngx-permissions';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { resolvePath } from 'src/assets/js/util';

@Component({
  selector: 'app-study-list',
  templateUrl: './study-list.component.html',
  styleUrls: ['./study-list.component.scss'],
  providers: [ScrollService]
})

export class StudyListComponent implements OnInit {
  usedURLs = ['/', '/studies'];
  // search dropdown filters
  searchColumns = [
    {'value': 'shortTitle', 'text': 'Short Title'},
    {'value': 'status', 'text': 'Status'},
    {'value': 'category', 'text': 'Category'},
    {'value': 'project.shortName', 'text': 'Project'},
  ]
  filterColumn: string = 'shortTitle';
  displayedColumns = ['shortTitle', 'status', 'category', 'project', 'actions'];
  dataSource: MatTableDataSource<StudyListEntryInterface>;
  searchText:string = '';
  studyLength: number = 0;
  title: string = '';
  warningModal: any;
  orgId: any;
  role: any;
  isManager: boolean = false;
  isBrowsing: boolean = false;
  deBouncedInputValue = this.searchText;
  searchDebounce: Subject<string> = new Subject();
  sticky: boolean = false;
  scroll: any;
  notDashboard:boolean = false;
  isOrgIdValid: boolean = false;
  dataChanged: boolean = false;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('studyDeleteModal') studyDeleteModal : TemplateRef<any>;

  constructor(private statesService: StatesService,
              private reuseService: ReuseService,
              private scrollService: ScrollService, 
              private listService: ListService, 
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private modalService: NgbModal,
              private studyService: StudyService,
              private permissionService: NgxPermissionsService,
              private router: Router) { }

  ngOnInit(): void {
    this.notDashboard = this.router.url.includes('studies') ? true : false;
    this.getStudyList();
    this.setupSearchDeBouncer();
    this.scrollService.handleScroll(['/studies']);

    // Updating data while reusing detached component
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.usedURLs.includes(event.urlAfterRedirects) && this.dataChanged) {
        this.getStudyList();
        this.dataChanged = false;
      }
    });

    this.reuseService.notification$.subscribe((source) => {
      if (this.usedURLs.includes(source) && !this.dataChanged) {
        this.dataChanged = true;
      }
    });
  }
  
  getSortedStudies(studies) {
    const { compare } = Intl.Collator('en-GB');
    studies.sort((a, b) => {
      return compare(a.shortTitle, b.shortTitle);
    });
  }

  getStudyList() {
    this.spinner.show();
    this.listService.getStudyList().subscribe((res: any) => {
      if (res) {
        this.getSortedStudies(res);
        this.dataSource = new MatTableDataSource<StudyListEntryInterface>(res);
        this.studyLength = res.length;
      } else {
        this.dataSource = new MatTableDataSource();
        this.studyLength = 0;
      }
      this.dataSource.paginator = this.paginator;
      this.filterSearch();
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
      this.toastr.error(error.error.title);
    });
  }

  deleteRecord(id) {
    const deleteModal = this.modalService.open(ConfirmationWindowComponent, { size: 'lg', backdrop: 'static' });
    deleteModal.componentInstance.itemType = 'study';

    deleteModal.result.then((data: any) => {
      if (data) {
        this.spinner.show();
        this.studyService.deleteStudyById(id).subscribe((res: any) => {
          if (res.status === 204) {
            this.toastr.success('Study deleted successfully');
            this.getStudyList();
          } else {
            this.toastr.error('Error when deleting study', res.statusText);
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
