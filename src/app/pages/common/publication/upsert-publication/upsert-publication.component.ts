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
  @Input() publicationsData: PublicationInterface[] = [];
  @Input() projectId: string;
  @Input() isView: boolean = false;


  publications: PublicationInterface[] = [];
  deletedPublicationIds: number[] = [];

  constructor(
    private publicationService: PublicationService,
    private toastr: ToastrService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['publicationsData']) {
      this.publications = (this.publicationsData || [])
        .map((publication, index) => ({
          ...publication,
          order: publication.order ?? index
        }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  }

  addPublication(): void {
    this.publications.push({
      title: '',
      pubmedUrl: '',
      project: this.projectId ? Number(this.projectId) : null,
      order: this.publications.length
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
      .map((publication, index) => {
        const payload: PublicationInterface = {
          title: publication.title,
          pubmedUrl: publication.pubmedUrl,
          project: Number(projectId),
          order: index
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