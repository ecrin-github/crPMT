import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';


@Component({
    selector: 'app-reports-internal',
    templateUrl: './reports-page-internal.component.html'
})
export class ReportsPageInternalComponent implements OnInit {

    displayedColumns = ['reportName', 'author', 'date', 'actions'];
    dataSource: MatTableDataSource<Report>;

    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

    constructor() {
        // Create 15 reports
        const reports: Report[] = [];
        for (let i = 1; i <= 100; i++) { reports.push(generateReports(i)); }
        this.dataSource = new MatTableDataSource(reports);
    }

    ngOnInit() {
        this.dataSource.paginator = this.paginator;
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }

}


/** Builds and returns a new reports. */
function generateReports(id: number): Report {
    const name =
        NAMES[Math.round(Math.random() * (NAMES.length - 1))] + ' ' +
        NAMES[Math.round(Math.random() * (NAMES.length - 1))].charAt(0) + '.';

    const date = new Date();

    return {
        id: id.toString(),
        report: 'Report ' + id.toString(),
        author: name,
        date: date.getDate().toString() + '/' + date.getMonth().toString() + '/' + date.getFullYear().toString(),
    };
}


/** Constants used to fill up our data base. */
const NAMES = ['Maia', 'Asher', 'Olivia', 'Atticus', 'Amelia', 'Jack',
    'Charlotte', 'Theodore', 'Isla', 'Oliver', 'Isabella', 'Jasper',
    'Cora', 'Levi', 'Violet', 'Arthur', 'Mia', 'Thomas', 'Elizabeth'];

export interface Report {
    id: string;
    report: string;
    author: string;
    date: string;
}
