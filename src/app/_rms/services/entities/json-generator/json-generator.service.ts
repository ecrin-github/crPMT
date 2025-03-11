import { Injectable } from '@angular/core';
import {FileSaverService} from 'ngx-filesaver';

@Injectable({
  providedIn: 'root'
})
export class JsonGeneratorService {

  constructor( private fileSaver: FileSaverService) { }

  jsonGenerator(data, type) {
    let filename: string;
    const currTime = new Date();
    const timeString = `${currTime.getFullYear()}${("0" + currTime.getMonth()).slice(-2)}${("0" + currTime.getDay()).slice(-2)}` +
                      `_${("0" + currTime.getHours()).slice(-2)}${("0" + currTime.getMinutes()).slice(-2)}${("0" + currTime.getSeconds()).slice(-2)}`;
    if (type === 'dtp') {
      filename = `DTP_${data.displayName}_${timeString}.json`;
    } else if (type === 'dup') {
      filename = `DUP_${data.displayName}_${timeString}.json`;
    } else if (type === 'study') {
      filename = `Study_${data.displayTitle}_${timeString}.json`;
    } else if (type === 'object') {
      filename = `DO_${data.displayTitle}_${timeString}.json`;
    }
    const fileType = this.fileSaver.genType(filename);
    const blob = new Blob([JSON.stringify(data)], {type: fileType});
    this.fileSaver.save(blob, filename);
  }
}
