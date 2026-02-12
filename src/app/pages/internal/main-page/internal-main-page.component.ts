import { Component, OnInit } from '@angular/core';
import { StudyService } from 'src/app/_rms/services/entities/study/study.service';
import { StudyCtuService } from 'src/app/_rms/services/entities/study-ctu/study-ctu.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-main-page-internal',
  templateUrl: './internal-main-page.component.html',
  styleUrls: ['./internal-main-page.component.scss'],
})
export class InternalMainPageComponent implements OnInit {

  dashboardCards = [
    { key:'trial', label:'ECRIN Mentioned in Trial Registration', value:0, icon:'fa-solid fa-file-lines', color:'bg-blue' },
    { key:'running', label:'Running Studies', value:0, icon:'fa-solid fa-circle-play', color:'bg-green' },
    { key:'startup', label:'Studies in Start-Up Phase', value:0, icon:'fa-solid fa-wave-square', color:'bg-yellow' },
    { key:'dm', label:'Data Management Services', value:0, icon:'fa-solid fa-database', color:'bg-cyan' },
    { key:'certified', label:'Certified Data Centre', value:0, icon:'fa-solid fa-shield-halved', color:'bg-mint' },
    { key:'lead', label:'ECRIN Lead CTU', value:0, icon:'fa-solid fa-building', color:'bg-orange' },
    { key:'vigilance', label:'Central Vigilance Services', value:0, icon:'fa-solid fa-shield-heart', color:'bg-purple' },
    { key:'sas', label:'CTUs Without Valid SAS', value:0, icon:'fa-solid fa-triangle-exclamation', color:'bg-pink' }
  ];

  constructor(
    private studyService: StudyService,
    private studyCtuService: StudyCtuService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private setValue(key: string, value: number) {
    const card = this.dashboardCards.find(c => c.key === key);
    if (card) card.value = value;
  }

  private flatten<T>(lists: T[][]): T[] {
    return ([] as T[]).concat(...lists);
  }

  private loadData() {
    this.studyService.getStudyList().subscribe((studies: any[]) => {
      const safeStudies = Array.isArray(studies) ? studies : [];

      this.setValue('trial', safeStudies.filter(s => !!s?.trialId).length);
      this.setValue('running', safeStudies.filter(s => s?.status === 'RUNNING').length);
      this.setValue('startup', safeStudies.filter(s => s?.status === 'STARTUP').length);

      const calls = safeStudies
        .filter(s => !!s?.id)
        .map(s =>
          this.studyCtuService.getStudyCTUs(s.id).pipe(
            catchError(() => of([]))
          )
        );


      if (!calls.length) {
        this.setValue('lead', 0);
        this.setValue('sas', 0);
        return;
      }

      forkJoin(calls).subscribe((results: any[][]) => {
        const all: any[] = this.flatten(results);

        this.setValue('lead', all.filter(sc => sc?.leadCtu === true).length);

        const uniqueCtu = new Map<number, any>();
        all.forEach(sc => {
          const id = sc?.ctu?.id;
          if (id != null) uniqueCtu.set(id, sc.ctu);
        });

        const ctus = Array.from(uniqueCtu.values());
        this.setValue('sas', ctus.filter(c => c?.sasVerification === false).length);

      });
    });
  }
}
