import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayoutService } from 'src/app/_rms';
import { StatesService } from 'src/app/_rms/services/states/states.service';
import { EChartsOption } from 'echarts';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import {
  DashboardDeadlineInterface,
  DashboardResponseInterface,
  DashboardStatusInterface,
  DashboardStudyInterface,
  DashboardSubmissionInterface,
  DashboardSubmissionsMonthInterface,
} from 'src/app/_rms/interfaces/dashboard/dashboard.interface';
import { DashboardService } from 'src/app/_rms/services/entities/dashboard/dashboard.service';

// Colour of each status group sent by the back-end (STATUS_GROUPS in crPMT-BE/core/views/dashboard.py)
const STATUS_COLORS: { [statusGroup: string]: string } = {
  'Running': '#000091',
  'Start-up': '#5465F2',
  'Completion': '#A5B0FB',
  'Completed': '#D0D5DD',
  'Stopped': '#F97066',
  'Other': '#B692F6',
  'Not set': '#EAECF0',
};
const DEFAULT_STATUS_COLOR = '#98A2B3';  // Status group added in the back-end but not above yet

const DUE_SOON_DAYS = 30;  // A deadline within this number of days gets the "Due soon" badge

@Component({
  selector: 'app-main-page-internal',
  templateUrl: './internal-main-page.component.html',
  styleUrls: ['./internal-main-page.component.scss']
})
export class InternalMainPageComponent implements OnInit {
  // ---- Dashboard  ----
  // Filled by loadDashboard() with the data of GET core/dashboard
  studyStatuses: DashboardStatusInterface[] = [];   // Only the status groups with at least 1 study
  submissionsByMonth: DashboardSubmissionsMonthInterface[] = [];
  upcomingDeadlines: DashboardDeadlineInterface[] = [];
  dashboardLoaded = false;   // Avoids showing the "no data" messages while loading

  // Colours of the "Regulatory submissions" series, also used by its legend
  readonly submittedColor = '#000091';
  readonly approvedColor = '#A5B0FB';

  studyStatusChartOptions: EChartsOption = {};
  submissionsChartOptions: EChartsOption = {};
  studyStatusTotal = 0;
  submittedTotal = 0;   // Totals of the 6 months, shown in the legend
  approvedTotal = 0;

  // Studies of the status clicked on the donut or its legend, shown in a modal
  @ViewChild('statusStudiesModal') statusStudiesModal: TemplateRef<any>;
  selectedStatus: DashboardStatusInterface = null;
  selectedStatusStudies: DashboardStudyInterface[] = [];
  selectedStatusLoading = false;

  // Submissions of the bar clicked on the "Regulatory submissions" chart, shown in a modal
  @ViewChild('submissionsModal') submissionsModal: TemplateRef<any>;
  selectedBar: { title: string; dateLabel: string; color: string; count: number } = null;
  selectedBarSubmissions: DashboardSubmissionInterface[] = [];
  selectedBarLoading = false;

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
              private dashboardService: DashboardService,
              private spinner: NgxSpinnerService,
              private toastr: ToastrService,
              private modalService: NgbModal) {
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
    this.organisationName = "";
    this.loadDashboard();
  }

  // Single query for the 3 cards: the back-end sends the figures already computed
  loadDashboard(): void {
    this.spinner.show();
    this.dashboardService.getDashboard().pipe(
      finalize(() => {   // Called on success and on error
        this.spinner.hide();
        this.dashboardLoaded = true;
      })
    ).subscribe({
      next: (data: DashboardResponseInterface) => {
        this.setDashboardData(data);
        this.buildStudyStatusChart();
        this.buildSubmissionsChart();
      },
      error: (err) => {
        this.toastr.error(err?.message, 'Failed to load the dashboard');
      }
    });
  }

  // Click on a slice of the donut or on a legend item: opens the modal, then loads the studies of that status
  openStatusStudies(statusName: string): void {
    const status = this.studyStatuses.find((s) => s.name === statusName);
    if (!status) {
      return;   // Click outside the slices (e.g. on the total in the centre)
    }

    this.selectedStatus = status;
    this.selectedStatusStudies = [];
    this.selectedStatusLoading = true;
    this.modalService.open(this.statusStudiesModal, { size: 'lg', scrollable: true });

    this.dashboardService.getDashboardStudies(status.name).pipe(
      finalize(() => this.selectedStatusLoading = false)
    ).subscribe({
      next: (studies) => this.selectedStatusStudies = studies,
      error: (err) => this.toastr.error(err?.message, `Failed to load the ${status.name} studies`),
    });
  }

  // Click on a bar: event.dataIndex is the position of the month, event.seriesName 'Submitted' or 'Approved'
  openBarSubmissions(event: { dataIndex?: number; seriesName?: string }): void {
    const month = this.submissionsByMonth[event?.dataIndex];
    if (!month || (event.seriesName !== 'Submitted' && event.seriesName !== 'Approved')) {
      return;
    }
    const series = event.seriesName === 'Submitted' ? 'submitted' : 'approved';

    this.selectedBar = {
      title: `${event.seriesName} in ${this.monthLabel(month.yearMonth, 'long')}`,
      dateLabel: series === 'submitted' ? 'Submitted on' : 'Approved on',
      color: series === 'submitted' ? this.submittedColor : this.approvedColor,
      count: month[series],
    };
    this.selectedBarSubmissions = [];
    this.selectedBarLoading = true;
    this.modalService.open(this.submissionsModal, { size: 'xl', scrollable: true });

    this.dashboardService.getDashboardSubmissions(month.yearMonth, series).pipe(
      finalize(() => this.selectedBarLoading = false)
    ).subscribe({
      next: (submissions) => this.selectedBarSubmissions = submissions,
      error: (err) => this.toastr.error(err?.message, 'Failed to load the submissions'),
    });
  }

  // Converts the back-end data into the data displayed by the cards
  setDashboardData(data: DashboardResponseInterface): void {
    this.studyStatuses = (data?.studiesByStatus ?? [])
      .filter((status) => status.value > 0)
      .map((status) => ({ ...status, color: STATUS_COLORS[status.name] ?? DEFAULT_STATUS_COLOR }));

    this.submissionsByMonth = (data?.submissionsByMonth ?? []).map((m) => ({
      ...m,
      month: this.monthLabel(m.month),
      yearMonth: m.month,   // Kept to ask the back-end for the submissions of a bar
    }));

    this.submittedTotal = this.submissionsByMonth.reduce((total, m) => total + m.submitted, 0);
    this.approvedTotal = this.submissionsByMonth.reduce((total, m) => total + m.approved, 0);

    this.upcomingDeadlines = (data?.upcomingDeadlines ?? []).map((deadline) => {
      const date = this.parseLocalDate(deadline.date);
      return { ...deadline, date: date, dueSoon: this.daysFromToday(date) <= DUE_SOON_DAYS };
    });
  }

  // Number of days between today and the given date (0: today)
  daysFromToday(date: Date): number {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.round((date.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
  }

  // 'YYYY-MM' -> 'Jun'
  monthLabel(yearMonth: string, format: 'short' | 'long' = 'short'): string {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    // 'short': 'Jun' (chart axis), 'long': 'June 2026' (modal title)
    return format === 'short'
      ? date.toLocaleString('en-GB', { month: 'short' })
      : date.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  }

  // 'YYYY-MM-DD' -> local date. new Date('YYYY-MM-DD') would read it as UTC midnight,
  // which is the day before in timezones west of UTC
  parseLocalDate(isoDate: string): Date {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Donut of the "Studies by status" card, the total is displayed in its centre
  buildStudyStatusChart(): void {
    this.studyStatusTotal = this.studyStatuses.reduce((total, status) => total + status.value, 0);

    this.studyStatusChartOptions = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      title: {
        text: String(this.studyStatusTotal),
        subtext: 'studies',
        left: 'center',
        top: '36%',
        itemGap: 4,
        textStyle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
        subtextStyle: { fontSize: 12, color: '#667085' },
      },
      series: [{
        type: 'pie',
        radius: ['68%', '100%'],
        label: { show: false },
        emphasis: { scale: false },   // No zoom on hover: the donut fills its box
        data: this.studyStatuses.map((status) => ({
          name: status.name,
          value: status.value,
          itemStyle: { color: status.color },
        })),
      }],
    };
  }

  // Grouped columns of the "Regulatory submissions" card: submitted and approved per month
  buildSubmissionsChart(): void {
    this.submissionsChartOptions = {
      tooltip: { trigger: 'axis' },
      grid: { left: 0, right: 0, top: 8, bottom: 0, containLabel: true },
      xAxis: {
        type: 'category',
        data: this.submissionsByMonth.map((m) => m.month),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: '#667085', fontSize: 12, margin: 12 },
      },
      // As in the design: no y axis nor grid lines, the values are in the tooltip
      yAxis: { type: 'value', minInterval: 1, show: false },
      series: [
        {
          name: 'Submitted',
          type: 'bar',
          barWidth: 16,
          barGap: '25%',
          itemStyle: { color: this.submittedColor, borderRadius: [3, 3, 0, 0] },
          data: this.submissionsByMonth.map((m) => m.submitted),
        },
        {
          name: 'Approved',
          type: 'bar',
          barWidth: 16,
          itemStyle: { color: this.approvedColor, borderRadius: [3, 3, 0, 0] },
          data: this.submissionsByMonth.map((m) => m.approved),
        },
      ],
    };
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
