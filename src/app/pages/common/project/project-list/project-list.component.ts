import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';
import { Subject, combineLatest, fromEvent } from 'rxjs';
import { NgxPermissionsService } from 'ngx-permissions';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { resolvePath } from 'src/assets/js/util';
import { ProjectListEntryInterface } from 'src/app/_rms/interfaces/project/project-listentry.interface';
import { ProjectService } from 'src/app/_rms/services/entities/project/project.service';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
  providers: [ScrollService]
})

export class ProjectListComponent implements OnInit {
  usedURLs = ['/', '/projects'];
  // search dropdown filters
  searchColumns = [
    {'value': 'shortName', 'text': 'Acronym'},
    {'value': 'name', 'text': 'Name'},
  ]
  filterColumn: string = 'shortName';
  displayedColumns = ['shortName', 'name', 'actions'];
  dataSource: MatTableDataSource<ProjectListEntryInterface>;
  searchText:string = '';
  title: string = '';
  projectsLength: number = 0;
  warningModal: any;
  role: any;
  deBouncedInputValue = this.searchText;
  searchDebounce: Subject<string> = new Subject();
  sticky: boolean = false;
  scroll: any;
  notDashboard:boolean = false;
  dataChanged: boolean = false;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('studyDeleteModal') studyDeleteModal : TemplateRef<any>;

  constructor(private statesService: StatesService,
              private reuseService: ReuseService,
              private scrollService: ScrollService, 
              private projectService: ProjectService,
              private spinner: NgxSpinnerService, 
              private toastr: ToastrService, 
              private modalService: NgbModal,
              private permissionService: NgxPermissionsService,
              private router: Router) { }

  ngOnInit(): void {
    this.notDashboard = this.router.url.includes('projects') ? true : false;
    this.getProjectList();
    this.setupSearchDeBouncer();
    this.scrollService.handleScroll(['/projects']);

    // Updating data while reusing detached component
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && this.usedURLs.includes(event.urlAfterRedirects) && this.dataChanged) {
        this.getProjectList();
        this.dataChanged = false;
      }
    });

    this.reuseService.notification$.subscribe((source) => {
      if (this.usedURLs.includes(source) && !this.dataChanged) {
        this.dataChanged = true;
      }
    });
  }
  
  getSortedProjects(projects) {
    const { compare } = Intl.Collator('en-GB');
    projects.sort((a, b) => {
      return compare(a.shortName, b.shortName);
    });
  }

  getProjectList() {
    this.spinner.show();
    this.projectService.getProjectList().subscribe((res: any) => {
      if (res) {
        this.getSortedProjects(res);
        this.dataSource = new MatTableDataSource<ProjectListEntryInterface>(res);
        this.projectsLength = res.length;
      } else {
        this.dataSource = new MatTableDataSource();
        this.projectsLength = 0;
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
    deleteModal.componentInstance.itemType = 'project';
    deleteModal.result.then((data: any) => {
      if (data) {
        this.spinner.show();
        this.projectService.deleteProjectById(id).subscribe((res: any) => {
          if (res.status === 204) {
            this.toastr.success('Project deleted successfully');
            this.getProjectList();
          } else {
            this.toastr.error('Error when deleting project', res.statusText);
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
