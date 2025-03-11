import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirstLetterPipe } from './first-letter.pipe';
import { SafePipe } from './safe.pipe';

@NgModule({
    declarations: [FirstLetterPipe, SafePipe],
    imports: [CommonModule],
    exports: [FirstLetterPipe, SafePipe],
})
export class PipesModule { }
