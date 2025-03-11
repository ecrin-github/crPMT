import { Component, HostListener, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { StudyListEntryInterface } from 'src/app/_rms/interfaces/study/study-listentry.interface';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';

@Component({
  selector: 'app-recent-studies',
  templateUrl: './recent-studies.component.html',
})

export class RecentStudiesComponent {
  @Input() cssClass;
  @Input() studyTotal: number = 0;
  displayedColumns = ['sdSid', 'title', 'type', 'status', 'actions'];
  dataSource: MatTableDataSource<StudyListEntryInterface>;
 
  constructor( private listService: ListService, 
               private toastr: ToastrService) { }

  ngOnInit() {
    this.getStudyList();
  }

  getStudyList() {
    const page = 1;
    this.listService.getStudyList().subscribe((res: any) => {
      if (res && res.results) {
        this.dataSource = new MatTableDataSource(res.results);
      } else {
        this.dataSource = new MatTableDataSource();
      }
    }, error => {
      this.toastr.error(error.error.title);
    })
  }
 
  @HostListener('window:storage', ['$event'])
  refreshList(event) {
    console.log('event triggered', event)
    this.getStudyList();
  }
}
