import { Component, HostListener, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NgxPermissionsService } from 'ngx-permissions';
import { ToastrService } from 'ngx-toastr';
import { ObjectListEntryInterface } from 'src/app/_rms/interfaces/data-object/data-object-listentry.interface';
import { ListService } from 'src/app/_rms/services/entities/list/list.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';

@Component({
  selector: 'app-recent-objects',
  templateUrl: './recent-objects.component.html',
})

export class RecentObjectsComponent {
  @Input() cssClass;
  @Input() objectTotal: number = 0;
  displayedColumns = ['sdOid', 'title', 'type', 'linkedStudy', 'actions'];
  dataSource: MatTableDataSource<ObjectListEntryInterface>;
  role: any;

  constructor(private statesService: StatesService,
              private toastr: ToastrService, 
              private listService: ListService, 
              private permissionService: NgxPermissionsService) { }

  ngOnInit(): void {
    this.getObjectList();
  }
  
  getObjectList() {
    const page = 1;
    this.listService.getObjectList('', page).subscribe((res: any) => {
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
    this.getObjectList();
  }
}
