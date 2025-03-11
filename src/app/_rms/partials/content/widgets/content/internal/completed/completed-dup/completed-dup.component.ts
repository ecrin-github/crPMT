import { Component, OnInit, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DashboardService } from 'src/app/_rms/services/entities/dashboard/dashboard.service';
import { LayoutService } from '../../../../../../../services/layout/layout.service';


@Component({
  selector: 'app-completed-dup',
  templateUrl: './completed-dup.component.html',
})
export class CompletedDupComponent implements OnInit {
  @Input() dupCompleted: number = 0;
  colorsGrayGray100: string;
  colorsGrayGray700: string;
  colorsThemeBaseSuccess: string;
  colorsThemeLightSuccess: string;
  fontFamily: string;
  chartOptions: any = {};
  dataCompleted: any;
  
  constructor(private layout: LayoutService, private dashboardService: DashboardService, private toastr: ToastrService) {
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
    this.getStatistics();
  }
  
  getStatistics() {
    this.dashboardService.getStatistics().subscribe((res: any) => {
    this.dataCompleted = Math.round((res.dup.total-(res.dup.total-res.dup.completed))*100/res.dup.total);
    this.chartOptions = this.getChartOptions();
    }, error => {
      this.toastr.error(error.error.title);
    })
  }

  getChartOptions() {
    const strokeColor = '#D13647';
    return {
      series: [this.dataCompleted],
      chart: {
        type: 'radialBar',
        height: 200,
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
            value: {
              color: this.colorsGrayGray700,
              fontSize: '30px',
              fontWeight: '700',
              offsetY: 12,
              show: true,
            },
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
      labels: ['Completed DUs'],
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
}
