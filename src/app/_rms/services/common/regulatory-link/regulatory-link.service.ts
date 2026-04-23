import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface RegulatoryLink {
  studyCountryId: string;
  authority: string;
  submissionNotApplicable: boolean;
  notificationNotApplicable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RegulatoryLinkService {
  private linksSubject = new BehaviorSubject<Map<string, RegulatoryLink>>(new Map());
  public links$ = this.linksSubject.asObservable();

  constructor() { }

  private getKey(studyCountryId: string, authority: string): string {
    return `${studyCountryId}_${authority}`;
  }

  getLink(studyCountryId: string, authority: string): RegulatoryLink | undefined {
    const key = this.getKey(studyCountryId, authority);
    return this.linksSubject.value.get(key);
  }

  setSubmissionNotApplicable(studyCountryId: string, authority: string, notApplicable: boolean): void {
    const key = this.getKey(studyCountryId, authority);
    const currentLinks = this.linksSubject.value;
    const existingLink = currentLinks.get(key);

    if (existingLink) {
      existingLink.submissionNotApplicable = notApplicable;
      // Sync notification N/A to match submission
      existingLink.notificationNotApplicable = notApplicable;
    } else {
      const newLink: RegulatoryLink = {
        studyCountryId,
        authority,
        submissionNotApplicable: notApplicable,
        notificationNotApplicable: notApplicable // Sync to submission
      };
      currentLinks.set(key, newLink);
    }

    this.linksSubject.next(new Map(currentLinks));
  }

  setNotificationNotApplicable(studyCountryId: string, authority: string, notApplicable: boolean): void {
    const key = this.getKey(studyCountryId, authority);
    const currentLinks = this.linksSubject.value;
    const existingLink = currentLinks.get(key);

    if (existingLink) {
      existingLink.notificationNotApplicable = notApplicable;
      // Sync submission N/A to match notification
      existingLink.submissionNotApplicable = notApplicable;
    } else {
      const newLink: RegulatoryLink = {
        studyCountryId,
        authority,
        submissionNotApplicable: notApplicable, // Sync to notification
        notificationNotApplicable: notApplicable
      };
      currentLinks.set(key, newLink);
    }

    this.linksSubject.next(new Map(currentLinks));
  }

  initializeFromData(studyCountryId: string, submissions: any[], notifications: any[]): void {
    const currentLinks = this.linksSubject.value;

    // Initialize from submissions
    submissions.forEach(sub => {
      const key = this.getKey(studyCountryId, sub.authority);
      const existingLink = currentLinks.get(key);
      if (!existingLink) {
        currentLinks.set(key, {
          studyCountryId,
          authority: sub.authority,
          submissionNotApplicable: sub.notApplicable || false,
          notificationNotApplicable: false
        });
      } else {
        // Update if not already set
        if (existingLink.submissionNotApplicable === undefined) {
          existingLink.submissionNotApplicable = sub.notApplicable || false;
        }
      }
    });

    // Initialize from notifications
    notifications.forEach(notif => {
      const key = this.getKey(studyCountryId, notif.authority);
      const existingLink = currentLinks.get(key);
      if (!existingLink) {
        currentLinks.set(key, {
          studyCountryId,
          authority: notif.authority,
          submissionNotApplicable: false,
          notificationNotApplicable: notif.notApplicable || false
        });
      } else {
        // Update if not already set
        if (existingLink.notificationNotApplicable === undefined) {
          existingLink.notificationNotApplicable = notif.notApplicable || false;
        }
      }
    });

    this.linksSubject.next(new Map(currentLinks));
  }

  getSubmissionNotApplicable(studyCountryId: string, authority: string): boolean {
    const link = this.getLink(studyCountryId, authority);
    return link?.submissionNotApplicable || false;
  }

  getNotificationNotApplicable(studyCountryId: string, authority: string): boolean {
    const link = this.getLink(studyCountryId, authority);
    return link?.notificationNotApplicable || false;
  }
}