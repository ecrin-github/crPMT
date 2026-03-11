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
    { key: 'trial',     label: 'ECRIN Mentioned in Trial Registration', value: 0, icon: 'fa-solid fa-file-lines',            color: 'bg-blue' },
    { key: 'running',   label: 'Running Studies',                        value: 0, icon: 'fa-solid fa-circle-play',          color: 'bg-green' },
    { key: 'startup',   label: 'Studies in Start-Up Phase',              value: 0, icon: 'fa-solid fa-wave-square',         color: 'bg-yellow' },
    { key: 'dm',        label: 'Data Management Services',               value: 0, icon: 'fa-solid fa-database',            color: 'bg-cyan' },
    { key: 'certified', label: 'Certified Data Centre',                  value: 0, icon: 'fa-solid fa-shield-halved',       color: 'bg-mint' },
    { key: 'lead',      label: 'ECRIN Lead CTU',                         value: 0, icon: 'fa-solid fa-building',            color: 'bg-orange' },
    { key: 'vigilance', label: 'Central Vigilance Services',             value: 0, icon: 'fa-solid fa-shield-heart',        color: 'bg-purple' },
    { key: 'sas',       label: 'CTUs Without Valid SAS',                 value: 0, icon: 'fa-solid fa-triangle-exclamation', color: 'bg-pink' },
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
            scale: true,
            scaleSize: 6
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
  getChartOptionsForCard(key: string): EChartsOption {
    const studiesForKpi = this.getStudiesForKpi(key);

    switch (key) {
      case 'trial':
        const withRegistration = studiesForKpi.filter(s => s?.trialRegistrationNumber).length;
        const withoutRegistration = studiesForKpi.filter(s => !s?.trialRegistrationNumber).length;
        const totalTrialStudies = withRegistration + withoutRegistration;

        return {
          series: [
            {
              type: 'pie',
              radius: ['50%', '70%'],
              data: [
                { name: 'With Registration', value: withRegistration },
                { name: 'Without Registration', value: withoutRegistration }
              ],
              label: {
                show: true,
                formatter: '{b}\n{c} ({d}%)'
              },
              itemStyle: {
              borderRadius: 8,
              borderColor: 'transparent', 
              borderWidth: 0  
            },emphasis: {
              scale: true,  
              scaleSize: 6 
            }
            }
          ]
        };

      case 'running':
        const runningStudies = studiesForKpi.filter(s => s?.status === 'running').length;
        const completedStudies = studiesForKpi.filter(s => s?.status === 'completed').length;

        return {
          series: [
            {
              type: 'pie',
              radius: ['50%', '70%'],
              data: [
                { name: 'Running', value: runningStudies },
                { name: 'Completed', value: completedStudies }
              ],
              label: {
                show: true,
                formatter: '{b}\n{c} ({d}%)'
              },
              itemStyle: {
              borderRadius: 8,
              borderColor: 'transparent', 
              borderWidth: 0  
            },emphasis: {
              scale: true,  
              scaleSize: 6 
            }
            }
          ]
        };

      case 'startup':
        const startupStudies = studiesForKpi.filter(s => s?.status === 'start-up phase').length;
        const totalStartupStudies = studiesForKpi.length;

        return {
          series: [
            {
              type: 'pie',
              radius: ['50%', '70%'],
              data: [
                { name: 'Start-Up', value: startupStudies },
                { name: 'Other', value: totalStartupStudies - startupStudies }
              ],
              label: {
                show: true,
                formatter: '{b}\n{c} ({d}%)'
              },
              itemStyle: {
              borderRadius: 8,
              borderColor: 'transparent',
              borderWidth: 0
            },
            emphasis: {
              scale: true,
              scaleSize: 6 
            }
            }
          ]
        };

      case 'dm':
        const dmStudies = studiesForKpi.filter(s => this.hasService(s, ['data management'])).length;
        const totalDmStudies = studiesForKpi.length;

        return {
          series: [
            {
              type: 'pie',
              radius: ['50%', '70%'],
              data: [
                { name: 'Data Management', value: dmStudies },
                { name: 'Other', value: totalDmStudies - dmStudies }
              ],
              label: {
                show: true,
                formatter: '{b}\n{c} ({d}%)'
              },
              itemStyle: {
              borderRadius: 8,
              borderColor: 'transparent',  
              borderWidth: 0  
            },emphasis: {
              scale: true,
              scaleSize: 6 
            }
            }
          ]
        };

      case 'certified':
        const certifiedStudies = studiesForKpi.filter(s => this.hasService(s, ['ecrin certified'])).length;
        const totalCertifiedStudies = studiesForKpi.length;

        return {
          series: [
            {
              type: 'pie',
              radius: ['50%', '70%'],
              data: [
                { name: 'Certified', value: certifiedStudies },
                { name: 'Other', value: totalCertifiedStudies - certifiedStudies }
              ],
              label: {
                show: true,
                formatter: '{b}\n{c} ({d}%)'
              },
              itemStyle: {
              borderRadius: 8,
              borderColor: 'transparent',  
              borderWidth: 0  
            },emphasis: {
              scale: true,  
              scaleSize: 6 
            }
            }
          ]
        };

      case 'lead':
        const leadStudies = studiesForKpi.filter(s => !!s?.leadCtu?.id).length;
        const totalLeadStudies = studiesForKpi.length;

        return {
          series: [
            {
              type: 'pie',
              radius: ['50%', '70%'],
              data: [
                { name: 'ECRIN Lead', value: leadStudies },
                { name: 'Other', value: totalLeadStudies - leadStudies }
              ],
              label: {
                show: true,
                formatter: '{b}\n{c} ({d}%)'
              },
              itemStyle: {
              borderRadius: 8,
              borderColor: 'transparent',
              borderWidth: 0
            },
            emphasis: {
              scale: true,
              scaleSize: 6
            }
            }
          ]
        };

      case 'vigilance':
        const vigilanceStudies = studiesForKpi.filter(s => this.hasService(s, ['pharmacovigilance', 'vigilance'])).length;
        const totalVigilanceStudies = studiesForKpi.length;

        return {
          series: [
            {
              type: 'pie',
              radius: ['50%', '70%'],
              data: [
                { name: 'Vigilance', value: vigilanceStudies },
                { name: 'Other', value: totalVigilanceStudies - vigilanceStudies }
              ],
              label: {
                show: true,
                formatter: '{b}\n{c} ({d}%)'
              },
              itemStyle: {
              borderRadius: 8,
              borderColor: 'transparent', 
              borderWidth: 0 
            },
            emphasis: {
              scale: true,  
              scaleSize: 6 
            }
            }
          ]
        };

      case 'sas':
        const sasStudies = studiesForKpi.filter(s =>
          (s?.studyCtus ?? []).some((sc: any) => sc?.ctu?.sasVerification === false)
        ).length;

        return {
          series: [
            {
              type: 'pie',
              radius: ['50%', '70%'],
              data: [
                { name: 'Valid SAS', value: studiesForKpi.length - sasStudies },
                { name: 'Invalid SAS', value: sasStudies }
              ],
              label: {
                show: true,
                formatter: '{b}\n{c} ({d}%)'
              },
              itemStyle: {
              borderRadius: 8,
              borderColor: 'transparent',
              borderWidth: 0  
            },emphasis: {
              scale: true,  
              scaleSize: 6 
            }
            }
          ]
        };

      default:
        return {};
    }
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
        }
      });
  }
}