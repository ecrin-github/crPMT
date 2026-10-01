import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NavigationEnd, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProjectListEntryInterface } from 'src/app/_rms/interfaces/core/project-listentry.interface';
import { ProjectService } from 'src/app/_rms/services/entities/project/project.service';
import { ListUpdateService } from 'src/app/_rms/services/list-update/list-update.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { anyStringToDateString, getFlagEmoji, getTagBgColor, getTagBorderColor, resolvePath } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';

@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.component.html',
    styleUrls: ['./project-list.component.scss'],
    providers: [ScrollService]
})

export class ProjectListComponent implements OnInit {
    usedURLs = ['/', '/projects'];
    filterColumn: string = 'shortName';
    displayedColumns = ['shortName', 'startDate', 'endDate', 'projectCoordinator', 'coordinatingInstitution', 'fundingSources', 'studies', 'actions'];
    dataSource: MatTableDataSource<ProjectListEntryInterface>;
    searchText: string = '';
    title: string = '';
    projectsLength: number = 0;
    warningModal: any;
    role: any;
    deBouncedInputValue = this.searchText;
    searchDebounce: Subject<string> = new Subject();
    sticky: boolean = false;
    scroll: any;
    notDashboard: boolean = false;
    dataChanged: boolean = false;

    @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
    @ViewChild('studyDeleteModal') studyDeleteModal: TemplateRef<any>;

    constructor(private listUpdateService: ListUpdateService,
        private reuseService: ReuseService,
        private scrollService: ScrollService,
        private projectService: ProjectService,
        private spinner: NgxSpinnerService,
        private toastr: ToastrService,
        private modalService: NgbModal,
        private router: Router) { }

    ngOnInit(): void {
        this.notDashboard = this.router.url.includes('projects') ? true : false;
        this.getProjectList();
        this.setupSearchDeBouncer();

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

        this.listUpdateService.listRefresh$.subscribe(() => this.getProjectList());
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
        deleteModal.componentInstance.setDefaultDeleteMessage("project");

        deleteModal.result.then((data: any) => {
            if (data) {
                this.spinner.show();
                this.projectService.deleteProjectById(id).subscribe((res: any) => {
                    if (res.status === 204) {
                        this.toastr.success('Project deleted successfully');
                        this.listUpdateService.sendListRefresh();   // Updating both project and study list
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
        this.dataSource.filterPredicate = (row: ProjectListEntryInterface, filter: string): boolean => {

            // const text = [row.shortName, row.startDate, row.endDate]
            //     .filter(value => value !== null && value !== undefined)
            //     .join(' ')
            //     .toLowerCase();

            // Note: could modify to search only selected fields, but for now searching on everything
            return JSON.stringify(row).toLowerCase().includes(filter.trim().toLowerCase());
        };

        this.dataSource.filter = this.searchText;
    }

    setupSearchDeBouncer() {
        const search$ = this.searchDebounce.pipe(
            debounceTime(10),
            distinctUntilChanged()
        ).subscribe((term: string) => {
            this.deBouncedInputValue = term;
            this.filterSearch();
        });
    }

    stringToDate(dateStr: string) {
        if (dateStr) {
            return anyStringToDateString(dateStr);
        }
    }

    getCountryFlag(iso2: string) {
        if (iso2) {
            return getFlagEmoji(iso2);
        }
        return '';
    }

    getTagBorderColor(text: string) {
        return getTagBorderColor(text);
    }

    getTagBgColor(text: string) {
        return getTagBgColor(text);
    }

    ngOnDestroy() {
        this.scrollService.unsubscribeScroll();
    }
}
