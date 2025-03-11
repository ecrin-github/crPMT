import { Component, HostListener, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { DtpListEntryInterface } from 'src/app/_rms/interfaces/dtp/dtp-listentry.interface';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';

@Component({
  selector: 'app-recent-dtu',
  templateUrl: './recent-dtu.component.html',
})
export class RecentDtuComponent {
  @Input() cssClass;
  @Input() dtpTotal: number = 0;
  displayedColumns = ['dtuId', 'organisation', 'title', 'status', 'actions'];
  dataSource: MatTableDataSource<DtpListEntryInterface>;

  constructor(private listService: ListService, 
              private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getDtpList();
  }
  getDtpList() {
    const page = 1;
    this.listService.getDtpList('', page).subscribe((res: any) => {
      if (res && res.results) {
        this.dataSource = new MatTableDataSource(res.results);
      } else {
        this.dataSource = new MatTableDataSource();
      }
    }, error => {
      this.toastr.error(error.error.title)
    })
  }
  
  @HostListener('window:storage', ['$event'])
  refreshList(event) {
    console.log('event triggered', event)
    this.getDtpList();
  }
}
