import { Component, OnInit, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { StudyCtuService } from 'src/app/_rms/services/entities/study-ctu/study-ctu.service';

import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { NgxSpinnerService } from 'ngx-spinner';
import { EChartsOption } from 'echarts';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-main-page-internal',
  templateUrl: './internal-main-page.component.html',
  styleUrls: ['./internal-main-page.component.scss'],
})
export class InternalMainPageComponent implements OnInit {
  dashboardCards = [
  { key: 'trial', label: 'ECRIN Mentioned in Trial Registration', value: 0, icon: 'fa-solid fa-file-lines', color: 'bg-blue', chartOptions: {}, legend: [] },
    { key: 'running', label: 'Running Studies', value: 0, icon: 'fa-solid fa-circle-play', color: 'bg-green', chartOptions: {}, legend: [] },
    { key: 'startup', label: 'Studies in Start-Up Phase', value: 0, icon: 'fa-solid fa-wave-square', color: 'bg-yellow', chartOptions: {}, legend: [] },
    { key: 'dm', label: 'Data Management Services', value: 0, icon: 'fa-solid fa-database', color: 'bg-cyan', chartOptions: {}, legend: [] },
    { key: 'certified', label: 'Certified Data Centre', value: 0, icon: 'fa-solid fa-shield-halved', color: 'bg-mint', chartOptions: {}, legend: [] },
    { key: 'lead', label: 'ECRIN Lead CTU', value: 0, icon: 'fa-solid fa-building', color: 'bg-orange', chartOptions: {}, legend: [] },
    { key: 'vigilance', label: 'Central Vigilance Services', value: 0, icon: 'fa-solid fa-shield-heart', color: 'bg-purple', chartOptions: {}, legend: [] },
    { key: 'sas', label: 'CTUs Without Valid SAS', value: 0, icon: 'fa-solid fa-triangle-exclamation', color: 'bg-pink', chartOptions: {}, legend: [] },
  ];

  studyStatusChartOptions: EChartsOption = {};
  allStudies: any[] = [];
  selectedKpiTitle = '';
  selectedStudies: any[] = [];

  private modalRef?: NgbModalRef;

  constructor(
    private studyService: StudyService,
    private studyCtuService: StudyCtuService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private setValue(key: string, value: number): void {
    const card = this.dashboardCards.find(c => c.key === key);
    if (card) {
      card.value = value;
    }
  }

  private flatten<T>(lists: T[][]): T[] {
    return ([] as T[]).concat(...lists);
  }

  private normalize(value: any): string {
    return (value ?? '').toString().trim().toLowerCase();
  }

  private hasService(study: any, keywords: string[]): boolean {
    const values = (study?.services ?? []).map((x: any) => this.normalize(x?.value));
    return keywords.some(keyword =>
      values.some((value: string) => value.includes(this.normalize(keyword)))
    );
  }

  private mapStudyStatus(status: any): string {
    const normalized = this.normalize(status);

    if (!normalized) {
      return 'Unknown';
    }

    if (normalized === 'start-up phase') {
      return 'Start-up';
    }

    if (normalized.startsWith('running phase')) {
      return 'Running';
    }

    if (normalized === 'completion & termination phase') {
      return 'Completion & termination';
    }

    if (normalized === 'completed') {
      return 'Completed';
    }

    if (normalized === 'withdrawn' || normalized === 'on hold') {
      return 'Stopped';
    }

    return 'Other';
  }

  private buildStudyStatusChart(studies: any[]): void {
    const counts: Record<string, number> = {
      'Start-up': 0,
      'Running': 0,
      'Completion & termination': 0,
      'Completed': 0,
      'Stopped': 0,
      'Unknown': 0,
      'Other': 0,
    };

    studies.forEach((study: any) => {
      const group = this.mapStudyStatus(study?.status);
      counts[group] = (counts[group] || 0) + 1;
    });

    const data = Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    this.studyStatusChartOptions = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: 0,
        left: 'center',
        itemWidth: 12,
        itemHeight: 12
      },
      series: [
        {
          name: 'Studies',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: 'transparent', 
            borderWidth: 0
          },
          label: {
            show: true,
            formatter: '{b}\n{c} ({d}%)'
          },
          emphasis: {
            scale: false,  
          },
          data
        }
      ]
    };
  }

  private resetDashboard(): void {
    this.allStudies = [];
    this.selectedStudies = [];
    this.selectedKpiTitle = '';

    this.setValue('trial', 0);
    this.setValue('running', 0);
    this.setValue('startup', 0);
    this.setValue('dm', 0);
    this.setValue('certified', 0);
    this.setValue('lead', 0);
    this.setValue('vigilance', 0);
    this.setValue('sas', 0);

    this.studyStatusChartOptions = {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, left: 'center' },
      series: [
        {
          name: 'Studies',
          type: 'pie',
          radius: ['45%', '70%'],
          data: []
        }
      ]
    };
  }

  openKpiModal(card: any, content: TemplateRef<any>): void {
    this.selectedKpiTitle = card?.label || 'Studies';
    this.selectedStudies = this.getStudiesForKpi(card?.key);
    this.modalRef = this.modalService.open(content, {
      size: 'xl',
      centered: true,
      scrollable: true
    });
  }

  redirectToStudyDetail(studyId: number): void {
    this.modalRef?.close();  
    this.router.navigate(['/studies', studyId, 'view']);
  }

  closeModal(): void {
    this.modalRef?.close();
  }

  private getStudiesForKpi(key: string): any[] {
    switch (key) {
      case 'trial':
        return this.allStudies.filter(s => !!s?.trialRegistrationNumber);

      case 'running':
        return this.allStudies.filter(s =>
          this.normalize(s?.status).includes('running')
        );

      case 'startup':
        return this.allStudies.filter(s =>
          this.normalize(s?.status) === 'start-up phase'
        );

      case 'dm':
        return this.allStudies.filter(s =>
          this.hasService(s, ['data management'])
        );

      case 'certified':
        return this.allStudies.filter(s =>
          this.hasService(s, ['ecrin certified'])
        );

      case 'lead':
        return this.allStudies.filter(s => !!s?.leadCtu?.id);

      case 'vigilance':
        return this.allStudies.filter(s =>
          this.hasService(s, ['pharmacovigilance', 'vigilance'])
        );

      case 'sas':
        return this.allStudies.filter(s =>
          (s?.studyCtus ?? []).some((sc: any) => sc?.ctu?.sasVerification === false)
        );

      default:
        return [];
    }
  }
  private buildKpiDonutChart(
    data: { name: string; value: number }[],
    title = 'Studies'
  ): EChartsOption {
    const palette = ['#4F6BED', '#B7D63D', '#7C8AA5', '#F59E0B', '#10B981', '#8B5CF6'];
    const safeData = data
      .filter(item => item.value > 0)
      .map((item, index) => ({
        ...item,
        itemStyle: {
          color: palette[index % palette.length],
          borderRadius: 6,
          borderColor: 'transparent',
          borderWidth: 0
        }
      }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      animation: true,
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['58%', '78%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false
          },
          labelLine: {
            show: false
          },
          emphasis: {
            scale: true,
            scaleSize: 6
          },
          data: safeData.length
            ? safeData
            : [
                {
                  name: 'No data',
                  value: 1,
                  itemStyle: { color: '#E5E7EB' }
                }
              ]
        }
      ]
    };
  }
  private buildLegend(data: { name: string; value: number }[]) {
    const palette = ['#4F6BED', '#B7D63D', '#7C8AA5', '#F59E0B', '#10B981', '#8B5CF6'];

    return data
      .filter(item => item.value > 0)
      .map((item, index) => ({
        ...item,
        color: palette[index % palette.length]
      }));
  }
  private getStatusGroupedData(studies: any[]): { name: string; value: number }[] {
    const counts: Record<string, number> = {
      'Start-up': 0,
      'Running': 0,
      'Completion & termination': 0,
      'Completed': 0,
      'Stopped': 0,
      'Unknown': 0,
      'Other': 0,
    };

    studies.forEach((study: any) => {
      const group = this.mapStudyStatus(study?.status);
      counts[group] = (counts[group] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }

  private updateCardCharts(): void {
    this.dashboardCards.forEach(card => {
      let data: { name: string; value: number }[] = [];

      switch (card.key) {
        case 'trial': {
          const withRegistration = this.allStudies.filter(s => !!s?.trialRegistrationNumber).length;
          const withoutRegistration = this.allStudies.filter(s => !s?.trialRegistrationNumber).length;
          data = [
            { name: 'With registration', value: withRegistration },
            { name: 'Without registration', value: withoutRegistration }
          ];
          break;
        }

        case 'running': {
          const running = this.allStudies.filter(s =>
            this.normalize(s?.status).includes('running')
          ).length;
          const other = this.allStudies.length - running;
          data = [
            { name: 'Running', value: running },
            { name: 'Other studies', value: other }
          ];
          break;
        }

        case 'startup': {
          const startup = this.allStudies.filter(s =>
            this.normalize(s?.status) === 'start-up phase'
          ).length;
          const other = this.allStudies.length - startup;
          data = [
            { name: 'Start-up phase', value: startup },
            { name: 'Other studies', value: other }
          ];
          break;
        }

        case 'dm': {
          const dm = this.allStudies.filter(s =>
            this.hasService(s, ['data management'])
          ).length;
          const other = this.allStudies.length - dm;
          data = [
            { name: 'Data management', value: dm },
            { name: 'Other studies', value: other }
          ];
          break;
        }

        case 'certified': {
          const certified = this.allStudies.filter(s =>
            this.hasService(s, ['ecrin certified'])
          ).length;
          const other = this.allStudies.length - certified;
          data = [
            { name: 'Certified', value: certified },
            { name: 'Other studies', value: other }
          ];
          break;
        }

        case 'lead': {
          const lead = this.allStudies.filter(s => !!s?.leadCtu?.id).length;
          const other = this.allStudies.length - lead;
          data = [
            { name: 'With lead CTU', value: lead },
            { name: 'Without lead CTU', value: other }
          ];
          break;
        }

        case 'vigilance': {
          const vigilance = this.allStudies.filter(s =>
            this.hasService(s, ['pharmacovigilance', 'vigilance'])
          ).length;
          const other = this.allStudies.length - vigilance;
          data = [
            { name: 'Vigilance service', value: vigilance },
            { name: 'Other studies', value: other }
          ];
          break;
        }

        case 'sas': {
          const withoutValidSas = this.allStudies.filter(s =>
            (s?.studyCtus ?? []).some((sc: any) => sc?.ctu?.sasVerification === false)
          ).length;
          const other = this.allStudies.length - withoutValidSas;
          data = [
            { name: 'Without valid SAS', value: withoutValidSas },
            { name: 'Other studies', value: other }
          ];
          break;
        }
      }

      card.chartOptions = this.buildKpiDonutChart(data, card.label);
      card.legend = this.buildLegend(data);
    });
  }
  private loadData(): void {
    this.spinner.show();

    this.studyService.getStudyList()
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (studies: any[]) => {
          const safeStudies = Array.isArray(studies) ? studies : [];
          this.allStudies = safeStudies;

          this.setValue('trial', safeStudies.filter(s => !!s?.trialRegistrationNumber).length);

          this.setValue(
            'running',
            safeStudies.filter(s => this.normalize(s?.status).includes('running')).length
          );

          this.setValue(
            'startup',
            safeStudies.filter(s => this.normalize(s?.status) === 'start-up phase').length
          );

          this.setValue(
            'dm',
            safeStudies.filter(s => this.hasService(s, ['data management'])).length
          );

          this.setValue(
            'vigilance',
            safeStudies.filter(s => this.hasService(s, ['pharmacovigilance', 'vigilance'])).length
          );

          this.setValue(
            'certified',
            safeStudies.filter(s => this.hasService(s, ['ecrin certified'])).length
          );

          this.setValue(
            'lead',
            safeStudies.filter(s => !!s?.leadCtu?.id).length
          );

          this.buildStudyStatusChart(safeStudies);
          this.updateCardCharts();

          const calls = safeStudies
            .filter(s => !!s?.id)
            .map(s =>
              this.studyCtuService.getStudyCTUs(s.id).pipe(
                catchError(() => of([]))
              )
            );

          if (!calls.length) {
            this.setValue('sas', 0);
            return;
          }

          this.spinner.show();

          forkJoin(calls)
            .pipe(finalize(() => this.spinner.hide()))
            .subscribe({
              next: (results: any[][]) => {
                const allStudyCtus: any[] = this.flatten(results);
                const uniqueCtu = new Map<number, any>();

                allStudyCtus.forEach(sc => {
                  const id = sc?.ctu?.id;
                  if (id != null) {
                    uniqueCtu.set(id, sc.ctu);
                  }
                });

                const ctus = Array.from(uniqueCtu.values());

                this.setValue(
                  'sas',
                  ctus.filter(c => c?.sasVerification === false).length
                );
                safeStudies.forEach((study, index) => {
                  study.studyCtus = results[index] || [];
                });

                this.allStudies = safeStudies;
                this.updateCardCharts();
              },
              error: (err) => {
                console.error('[KPI] getStudyCTUs error', err);
                this.setValue('sas', 0);
              }
            });
        },

        error: (err) => {
          console.error('[KPI] getStudyList error', err);
          this.resetDashboard();
          this.updateCardCharts();
        }
      });
  }
}