import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-new-dup',
  templateUrl: './new-dup.component.html',
})
export class NewDupComponent implements OnInit {
  @Input() cssClass = '';
  @Input() widgetHeight = '150px';
  @Input() baseColor = 'success';
  textInverseCSSClass;

  constructor() { }

  ngOnInit() {
    this.cssClass = `bg-${this.baseColor} ${this.cssClass}`;
    this.textInverseCSSClass = `text-inverse-${this.baseColor}`;
  }

}
