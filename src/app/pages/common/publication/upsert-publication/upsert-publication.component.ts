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
  @Input() projectId?: string;
  @Input() isView: boolean = false;


  publications: PublicationInterface[] = [];
  deletedPublicationIds: number[] = [];
  submitted: boolean = false;

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
      project: this.projectId ? Number(this.projectId) : undefined,
      order: this.publications.length,
      publicationAcknowledgingEcrin: false,
      ecrinEmployeeInAuthors: false
    });
  } 
  removePublication(index: number): void {
    const publication = this.publications[index];

    if (publication?.id) {
      this.deletedPublicationIds.push(publication.id);
    }

    this.publications.splice(index, 1);
  }

  allFormsValid(): boolean {
    this.submitted = true;
    return this.publications.every((publication) => !!publication.title?.trim());
  }

  getHttpLink(link: string): string {
    if (link && !link.toLowerCase().startsWith('http')) {
      return 'https://' + link;
    }
    return link;
  }

  onSave(projectId: string | number): Observable<boolean[]> {
    // One bulk query per action (delete, add, edit) instead of one query per publication (#18)
    const requests: Observable<boolean>[] = [];
    const addPayload: PublicationInterface[] = [];
    const editPayload: PublicationInterface[] = [];

    if (this.deletedPublicationIds.length > 0) {
      requests.push(this.publicationService.deletePublications(this.deletedPublicationIds).pipe(
        map((res: any) => res.status === 204),
        catchError(() => of(false))
      ));
    }

    this.publications.forEach((publication, index) => {
        const payload: PublicationInterface = {
          title: publication.title,
          pubmedUrl: publication.pubmedUrl,
          project: Number(projectId),
          order: index,
          publicationAcknowledgingEcrin: publication.publicationAcknowledgingEcrin ?? false,
          ecrinEmployeeInAuthors: publication.ecrinEmployeeInAuthors ?? false
        };

        if (publication.id) {
          editPayload.push({ ...payload, id: publication.id });
        } else {
          addPayload.push(payload);
        }
    });

    if (addPayload.length > 0) {
      requests.push(this.publicationService.addPublications(addPayload).pipe(
        map((res: any) => res.status === 201),
        catchError(() => of(false))
      ));
    }

    if (editPayload.length > 0) {
      requests.push(this.publicationService.editPublications(editPayload).pipe(
        map((res: any) => res.status === 200),
        catchError(() => of(false))
      ));
    }

    if (!requests.length) {
      return of([true]);
    }

    return combineLatest(requests);
  }
}