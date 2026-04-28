import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PublicationService, PublicationInterface } from 'src/app/_rms/services/entities/publication/publication.service';

@Component({
  selector: 'app-upsert-publication',
  templateUrl: './upsert-publication.component.html',
  styleUrls: ['./upsert-publication.component.scss']
})
export class UpsertPublicationComponent implements OnChanges {
  @Input() projectId: string;
  @Input() isView: boolean = false;
  @Input() isEdit: boolean = false;
  @Input() isAdd: boolean = false;

  publications: PublicationInterface[] = [];
  deletedPublicationIds: number[] = [];
  loaded = false;

  constructor(
    private publicationService: PublicationService,
    private toastr: ToastrService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId && (this.isEdit || this.isView)) {
      this.loadPublications();
    }
  }

    loadPublications(): void {
        if (!this.projectId) {
            return;
        }

        console.log('projectId =', this.projectId);

        this.publicationService.getPublicationsByProject(this.projectId).subscribe({
            next: (res: any[]) => {
            console.log('publications success =', res);
            this.publications = Array.isArray(res) ? res : [];
            this.loaded = true;
            },
            error: (err) => {
            console.error('publications error =', err);
            this.publications = [];
            this.loaded = true;
            this.toastr.error('Error loading publications');
            }
        });
    }

  addPublication(): void {
    this.publications.push({
      title: '',
      pubmedUrl: '',
      project: Number(this.projectId),
      study: null
    });
  }

  removePublication(index: number): void {
    const publication = this.publications[index];

    if (publication?.id) {
      this.deletedPublicationIds.push(publication.id);
    }

    this.publications.splice(index, 1);
  }

  getHttpLink(link: string): string {
    if (link && !link.toLowerCase().startsWith('http')) {
      return 'https://' + link;
    }
    return link;
  }

  onSave(projectId: string | number): Observable<boolean[]> {
    const deleteRequests = this.deletedPublicationIds.map((id) =>
      this.publicationService.deletePublication(id).pipe(
        map(() => true),
        catchError(() => of(false))
      )
    );

    const upsertRequests = this.publications
      .filter(p => p.title || p.pubmedUrl)
      .map((publication) => {
        const payload: PublicationInterface = {
          title: publication.title,
          pubmedUrl: publication.pubmedUrl,
          project: Number(projectId),
          study: publication.study ?? null
        };

        if (publication.id) {
          return this.publicationService.editPublication(publication.id, payload).pipe(
            map(() => true),
            catchError(() => of(false))
          );
        }

        return this.publicationService.addPublication(payload).pipe(
          map(() => true),
          catchError(() => of(false))
        );
      });

    const requests = [...deleteRequests, ...upsertRequests];

    if (!requests.length) {
      return of([true]);
    }

    return combineLatest(requests);
  }
}