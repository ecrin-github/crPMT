import { Injectable } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesService {
  /* Keeps track of the forms displayed on the page to warn the user before leaving an add/edit page with unsaved changes (#6) */
  private forms: Set<FormGroupDirective> = new Set();

  constructor(private router: Router) {
    // Browser's native popup when closing the tab, refreshing or leaving the app (the message itself can't be customised)
    window.addEventListener('beforeunload', (event: BeforeUnloadEvent) => {
      if (this.isUpsertPage() && this.hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }

  register(form: FormGroupDirective) {
    this.forms.add(form);
  }

  unregister(form: FormGroupDirective) {
    this.forms.delete(form);
  }

  hasUnsavedChanges(): boolean {
    // A form becomes dirty as soon as the user changes one of its fields (not when the form is filled by the code)
    return [...this.forms].some(f => f.form?.dirty);
  }

  markAllAsPristine() {
    // To call after a successful save, so that the redirection to the view page doesn't trigger the popup
    this.forms.forEach(f => f.form?.markAsPristine());
  }

  private isUpsertPage(): boolean {
    // Ignoring the query params and fragment of the url
    return /\/(add|edit)$/.test(this.router.url.split(/[?#]/)[0]);
  }
}
