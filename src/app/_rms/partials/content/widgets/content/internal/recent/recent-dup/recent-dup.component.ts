import { Component, HostListener, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { DupListEntryInterface } from 'src/app/_rms/interfaces/dup/dup-listentry.interface';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';

@Component({
  selector: 'app-recent-dup',
  templateUrl: './recent-dup.component.html',
})

export class RecentDupComponent {
  @Input() cssClass;
  @Input() dupTotal: number = 0;
  displayedColumns = ['dtpId', 'organisation', 'title', 'status', 'actions'];
  dataSource: MatTableDataSource<DupListEntryInterface>;
   
  constructor( private listService: ListService, 
               private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getDupList();
  }

  getDupList() {
    const page = 1;
    this.listService.getDupList('', page).subscribe((res: any) => {
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
    this.getDupList();
  }
}
