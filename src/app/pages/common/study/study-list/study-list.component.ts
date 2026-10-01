import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NavigationEnd, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StudyListEntryInterface } from 'src/app/_rms/interfaces/core/study-listentry.interface';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { ListUpdateService } from 'src/app/_rms/services/list-update/list-update.service';
import { ReuseService } from 'src/app/_rms/services/reuse/reuse.service';
import { ScrollService } from 'src/app/_rms/services/scroll/scroll.service';
import { getFlagEmoji, resolvePath } from 'src/assets/js/util';
import { ConfirmationWindowComponent } from '../../confirmation-window/confirmation-window.component';

@Component({
    selector: 'app-study-list',
    templateUrl: './study-list.component.html',
    styleUrls: ['./study-list.component.scss'],
    providers: [ScrollService]
})

export class StudyListComponent implements OnInit {
    usedURLs = ['/', '/studies'];
    displayedColumns = ['shortTitle', 'status', 'sponsorOrganisation', 'sponsorCountry', 'cEuco', 'studyCountries', 'project', 'actions'];
    dataSource: MatTableDataSource<StudyListEntryInterface>;
    searchText: string = '';
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
    notDashboard: boolean = false;
    isOrgIdValid: boolean = false;
    dataChanged: boolean = false;

    @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
    @ViewChild('studyDeleteModal') studyDeleteModal: TemplateRef<any>;

    constructor(private listUpdateService: ListUpdateService,
        private reuseService: ReuseService,
        private scrollService: ScrollService,
        private spinner: NgxSpinnerService,
        private toastr: ToastrService,
        private modalService: NgbModal,
        private studyService: StudyService,
        private router: Router) { }

    ngOnInit(): void {
        this.notDashboard = this.router.url.includes('studies') ? true : false;
        this.getStudyList();
        this.setupSearchDeBouncer();

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

        this.listUpdateService.listRefresh$.subscribe(() => this.getStudyList());
    }

    getSortedStudies(studies) {
        const { compare } = Intl.Collator('en-GB');
        studies.sort((a, b) => {
            return compare(a.shortTitle, b.shortTitle);
        });
    }

    getStudyList() {
        this.spinner.show();
        this.studyService.getStudyList().subscribe((res: any) => {
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
        deleteModal.componentInstance.setDefaultDeleteMessage("study");

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
        this.dataSource.filterPredicate = (row: StudyListEntryInterface, filter: string): boolean => {

            // const text = [row.shortTitle, ...]
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

    getCountryFlag(iso2: string) {
        if (iso2) {
            return getFlagEmoji(iso2);
        }
        return '';
    }

    ngOnDestroy() {
        this.scrollService.unsubscribeScroll();
    }
}
