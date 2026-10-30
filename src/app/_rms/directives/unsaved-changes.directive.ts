import { Directive, OnDestroy, OnInit, Self } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { UnsavedChangesService } from '../services/unsaved-changes/unsaved-changes.service';

@Directive({
  // Applied automatically to every [formGroup] of the components declared in the same module
  selector: '[formGroup]'
})
export class UnsavedChangesDirective implements OnInit, OnDestroy {
  /* Registers the form to the UnsavedChangesService while it is displayed (#6) */

  constructor(@Self() private formGroupDirective: FormGroupDirective,
              private unsavedChangesService: UnsavedChangesService) { }

  ngOnInit(): void {
    this.unsavedChangesService.register(this.formGroupDirective);
  }

  ngOnDestroy(): void {
    this.unsavedChangesService.unregister(this.formGroupDirective);
  }
}
