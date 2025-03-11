import { Component, HostListener, OnInit } from '@angular/core';
import { LayoutService } from 'src/app/_rms';
import { DashboardService } from 'src/app/_rms/services/entities/dashboard/dashboard.service';
import { StatesService } from 'src/app/_rms/services/states/states.service';

@Component({
  selector: 'app-main-page-internal',
  templateUrl: './internal-main-page.component.html',
  styleUrls: ['./internal-main-page.component.scss']
})
export class InternalMainPageComponent implements OnInit {
  colorsGrayGray100: string;
  colorsGrayGray700: string;
  colorsThemeBaseSuccess: string;
  colorsThemeLightSuccess: string;
  fontFamily: string;
  dtpChartOptions: any = {};
  dtpTotal: number = 0;
  dupChartOptions: any = {};
  dupTotal: number = 0;
  studyChartOptions: any = {};
  studyTotal: any;
  objectChartOptions: any = {};
  objectTotal: any;
  peopleChartOptions: any = {};
  peopleTotal: any;
  valuePer: any = {};
  valueNum: any = {};
  organisation: string = '';
  organisationName: string = '';
  role: string = '';
  
  constructor(private statesService: StatesService,
              private layout: LayoutService,
              private dashboardService: DashboardService) { 
    this.colorsGrayGray100 = this.layout.getProp('js.colors.gray.gray100');
    this.colorsGrayGray700 = this.layout.getProp('js.colors.gray.gray700');
    this.colorsThemeBaseSuccess = this.layout.getProp(
      'js.colors.theme.base.success'
    );
    this.colorsThemeLightSuccess = this.layout.getProp(
      'js.colors.theme.light.success'
    );
    this.fontFamily = this.layout.getProp('js.fontFamily');
  }

  ngOnInit(): void {
    this.organisation = this.statesService.currentAuthOrgId;
    this.organisationName = this.statesService.currentUser.userProfile?.organisation?.defaultName;
    // this.getStatistics();
  }

  getStatistics() {
    this.dashboardService.getStatistics().subscribe((res: any) => {
      if (res) {
        this.studyTotal = res.totalStudies;
        this.studyChartOptions = this.getChartOptions(this.studyTotal, 'Total Studies', false);
        this.objectTotal = res.totalObjects;
        this.objectChartOptions = this.getChartOptions(this.objectTotal, 'Total Objects', false);
        this.peopleTotal = res.totalUsers;
        this.peopleChartOptions = this.getChartOptions(this.peopleTotal, 'Total People', false);
        this.dtpTotal = res.dtp.total;
        this.dtpChartOptions = this.getChartOptions(this.dtpTotal, 'Completed DTs', false);  
        this.dupTotal = res.dup.total;
        this.dupChartOptions = this.getChartOptions(this.dupTotal, 'Completed DUs', false);
        }
    }, error => {

    })
  }

  getChartOptions(data, label, format) {
    this.valuePer = {
      color: this.colorsGrayGray700,
      fontSize: '20px',
      fontWeight: '700',
      offsetY: 12,
      show: true,
    };
    this.valueNum = {
      formatter: function (val) {
        return parseInt(val.toString(), 10).toString();
      },
      color: this.colorsGrayGray700,
      fontSize: '20px',
      fontWeight: '700',
      offsetY: 12,
      show: true,
    }
    const strokeColor = '#D13647';
    return {
      series: [data],
      offsetX: 5000,
      chart: {
        type: 'radialBar',
        height: 170,
      },
      plotOptions: {
        radialBar: {
          hollow: {
            margin: 0,
            size: '65%',
          },
          dataLabels: {
            showOn: 'always',
            name: {
              show: false,
              fontWeight: '700',
            },
            value: format ? this.valuePer : this.valueNum,
          },
          track: {
            background: this.colorsThemeLightSuccess,
            strokeWidth: '100%',
          },
        },
      },
      colors: [this.colorsThemeBaseSuccess],
      stroke: {
        lineCap: 'round',
      },
      labels: [label],
      legend: {},
      dataLabels: {},
      fill: {},
      xaxis: {},
      yaxis: {},
      states: {},
      tooltip: {},
      markers: {},
    };
  }

  scrollToElement($element): void {
    var topOfElement = $element.offsetTop - 135;
    window.scroll({ top: topOfElement, behavior: "smooth" });
  }
}
