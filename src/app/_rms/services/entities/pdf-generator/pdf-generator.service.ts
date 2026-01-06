import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  colNb = 12;
  monthNames = ["January", "February", "March",  "April", "May", "June",  "July", "August", "September", "October", "November", "December"];
  defaultMissingValueText = '';

  constructor() { }

  colSpanCalc(nbColRow) {
    return Math.floor(this.colNb/nbColRow);
  }

  makeTable(data, doc, x, y, theme, styles, columnStyles, didDrawCell?) {
    const offsetUpTables = 3; // Tables start lower than other regular jsPdf objects for some reason so we apply a negative offset 
    y -= offsetUpTables;
    // Setting column widths (colSpan) dynamically depending on the number of items in the row
    data.forEach((row) => {
      const rowLen = row.length;
      row.forEach((cell) => {
        if (!('colSpan' in cell)) {
          cell.colspan = this.colSpanCalc(rowLen);
        }
      })
    });

    // Creating table
    let tableMeta = null;
    if (didDrawCell) {
      autoTable(doc, {
        startY: y,
        margin: {left: x},
        styles: styles,
        columnStyles: columnStyles,
        theme: theme,
        body: data,
        rowPageBreak: 'avoid',
        didDrawCell: didDrawCell,
        didDrawPage: function (data) {
          if (!tableMeta) {
            tableMeta = data.table;
          }
        }
      });
    } else {
      autoTable(doc, {
        startY: y,
        margin: {left: x},
        styles: styles,
        columnStyles: columnStyles,
        theme: theme,
        body: data,
        rowPageBreak: 'avoid',
        didDrawPage: function (data) {
          if (!tableMeta) {
            tableMeta = data.table;
          }
        }
      });
    }

    // Returning y position of table bottom
    return tableMeta?.finalY ? tableMeta.finalY : y;
  }

  dtpPdfGenerator(dtpData) {
    const doc = new jsPDF();

    const offsetX = 16;
    const offsetY = 25;
    const offsetT1 = 12;
    const offsetT2 = 6;
    const offsetSection = 14;
    const offsetGeneral = 9;
    const t1Size = 18;
    const t2Size = 15;
    const t3Size = 12;
    const textSize = 10;

    let currX = offsetX;
    let currY = offsetY;

    /* Title */
    currY = this.makeTable([
      [
        { content: `Data Transfer - ${dtpData.displayName}`, rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t1Size } }
      ]
    ], doc, currX, currY, 'plain', {cellPadding: 0}, {});
  
    /* Study ID */
    currY += offsetT1;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Transfering Organisation', currX, currY);
    doc.setFont(undefined, 'normal');
    
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: (dtpData.organisation?.defaultName ? dtpData.organisation.defaultName : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: t3Size } }
      ]
    ], doc, currX, currY, 'plain', {cellPadding: 0}, {});

    /* Associated Studies */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Studies', currX, currY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(textSize);
    
    currY += offsetT2;
    if (dtpData.associatedStudies.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Study ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Study Title', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ]
      ].concat(
        dtpData.associatedStudies.map(associatedStudy => [
          { content: (associatedStudy.study?.sdSid ? associatedStudy.study.sdSid : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (associatedStudy.study?.displayTitle ? associatedStudy.study.displayTitle : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Associated Data Objects */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Data Objects', currX, currY);
    
    currY += offsetT2;
    if (dtpData.associatedObjects.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Data Object ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Data Object Title', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Access Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Embargo Until', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Data Object Instances', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } }
        ]
      ].concat(
        dtpData.associatedObjects.map(obj => [
            { content: (obj.dataObject?.sdOid ? obj.dataObject.sdOid : this.defaultMissingValueText), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize} },
            { content: (obj.dataObject?.displayTitle ? obj.dataObject.displayTitle : this.defaultMissingValueText), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
            { content: (obj.dataObject?.accessType?.name ? obj.dataObject.accessType.name : 'Unknown'), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
            { content: (obj.dataObject?.embargoExpiry ? (obj.dataObject.embargoExpiry.slice(0, 10)) : this.defaultMissingValueText), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
            { content: (obj.dataObject?.objectInstances?.length > 0 ?
              (obj.dataObject?.objectInstances?.map(instance => {
                return '• ' + (instance?.resourceType?.name ? instance.resourceType.name : 'Unknown resource type');
              }).join('\n')) : 'No instances'), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      ), doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Data Objects Controlled Access Pre-requisites */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Data Objects Controlled Access Prerequisites', currX, currY);
    
    // Data sharing statement before the table
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Study ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Data Sharing Statement', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ]
    ].concat(
      dtpData.associatedStudies.map(associatedStudy => [
        { content: (associatedStudy.study?.sdSid ? associatedStudy.study.sdSid : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: (associatedStudy.study?.dataSharingStatement ? associatedStudy.study.dataSharingStatement : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ])
    ), doc, currX, currY, 'grid', {}, {});
    
    currY += offsetT2;
    if (dtpData.prereqs.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Data Object ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Prerequisite type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Prerequisite details', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ]
      ].concat(
        dtpData.prereqs.map(prereq => [
          { content: (prereq?.dtpDataObject?.dataObject?.sdOid ? prereq.dtpDataObject.dataObject.sdOid : this.defaultMissingValueText), 
            rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (prereq?.prereqType?.name ? prereq.prereqType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (prereq.prereqNotes ? prereq.prereqNotes : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'No object-specific prerequisites', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Associated People */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Associated People', currX, currY);
    
    currY += offsetT2;
    if (dtpData.associatedUsers.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Name', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Email', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ]
      ].concat(
        dtpData.associatedUsers.map(user => [
          { content: (user.person?.firstName || user.person?.lastName ? (user.person.firstName + ' ' + user.person.lastName).trim() : this.defaultMissingValueText), 
            rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (user.person?.email ? user.person.email : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    doc.save(dtpData.displayName + '.pdf');
  }

  dupPdfGenerator(dupData) {
    const doc = new jsPDF();

    const offsetX = 16;
    const offsetY = 25;
    const offsetT1 = 12;
    const offsetT2 = 6;
    const offsetSection = 14;
    const offsetGeneral = 9;
    const t1Size = 18;
    const t2Size = 15;
    const t3Size = 12;
    const textSize = 10;

    let currX = offsetX;
    let currY = offsetY;

    /* Title */
    currY = this.makeTable([
      [
        { content: `Data Use - ${dupData.displayName}`, rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t1Size } }
      ]
    ], doc, currX, currY, 'plain', {cellPadding: 0}, {});
  
    /* Study ID */
    currY += offsetT1;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Provider Organisation', currX, currY);
    doc.setFont(undefined, 'normal');
    
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: (dupData.organisation?.defaultName ? dupData.organisation.defaultName : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: t3Size } }
      ]
    ], doc, currX, currY, 'plain', {cellPadding: 0}, {});

    /* Associated Studies */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Studies', currX, currY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(textSize);
    
    currY += offsetT2;
    if (dupData.associatedStudies.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Study ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Study Title', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ]
      ].concat(
        dupData.associatedStudies.map(associatedStudy => [
          { content: (associatedStudy.study?.sdSid ? associatedStudy.study.sdSid : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (associatedStudy.study?.displayTitle ? associatedStudy.study.displayTitle : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Associated Data Objects */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Data Objects', currX, currY);
    
    currY += offsetT2;
    if (dupData.associatedObjects.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Data Object ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Data Object Title', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Access Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Embargo Until', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Data Object Instances', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } }
        ]
      ].concat(
        dupData.associatedObjects.map(obj => [
            { content: (obj.dataObject?.sdOid ? obj.dataObject.sdOid : this.defaultMissingValueText), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize} },
            { content: (obj.dataObject?.displayTitle ? obj.dataObject.displayTitle : this.defaultMissingValueText), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
            { content: (obj.dataObject?.accessType?.name ? obj.dataObject.accessType.name : 'Unknown'), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
            { content: (obj.dataObject?.embargoExpiry ? (obj.dataObject.embargoExpiry.slice(0, 10)) : this.defaultMissingValueText), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
            { content: (obj.dataObject?.objectInstances?.length > 0 ?
              (obj.dataObject?.objectInstances?.map(instance => {
                return '• ' + (instance?.resourceType?.name ? instance.resourceType.name : 'Unknown resource type');
              }).join('\n')) : 'No instances'), 
                        rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      ), doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Data Objects Controlled Access Pre-requisites */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Data Objects Controlled Access Prerequisites', currX, currY);
    
    // Data sharing statement before the table
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Study ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Data Sharing Statement', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ]
    ].concat(
      dupData.associatedStudies.map(associatedStudy => [
        { content: (associatedStudy.study?.sdSid ? associatedStudy.study.sdSid : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: (associatedStudy.study?.dataSharingStatement ? associatedStudy.study.dataSharingStatement : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ])
    ), doc, currX, currY, 'grid', {}, {});
    
    currY += offsetT2;
    if (dupData.prereqs.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Data Object ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Prerequisite type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Prerequisite details', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ]
      ].concat(
        dupData.prereqs.map(prereq => [
          { content: (prereq?.dtpDataObject?.dataObject?.sdOid ? prereq.dtpDataObject.dataObject.sdOid : this.defaultMissingValueText), 
            rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (prereq?.prereqType?.name ? prereq.prereqType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (prereq.prereqNotes ? prereq.prereqNotes : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'No object-specific prerequisites', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Associated People */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Associated People', currX, currY);
    
    currY += offsetT2;
    if (dupData.associatedUsers.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Name', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Email', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ]
      ].concat(
        dupData.associatedUsers.map(user => [
          { content: (user.person?.firstName || user.person?.lastName ? (user.person.firstName + ' ' + user.person.lastName).trim() : this.defaultMissingValueText), 
            rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (user.person?.email ? user.person.email : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    doc.save(dupData.displayName + '.pdf');
  }

  studyPdfGenerator(studyData) {
    const doc = new jsPDF();

    const offsetX = 16;
    const offsetY = 25;
    const offsetT1 = 10;
    const offsetT2 = 6;
    const offsetSection = 14;
    const offsetGeneral = 9;
    const t1Size = 18;
    const t2Size = 15;
    const t3Size = 12;
    const textSize = 10;

    let currX = offsetX;
    let currY = offsetY;

    /* Title */
    currY = this.makeTable([
      [
        { content: studyData.displayTitle, rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t1Size } }
      ]
    ], doc, currX, currY, 'plain', {cellPadding: 0}, {});

    /* Study ID */
    currY += offsetT1;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Study ID', currX, currY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(textSize);
    
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: (studyData.sdSid ? studyData.sdSid : 'Missing study ID'), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
      ]
    ], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    
    /* Study description */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Study Description', currX, currY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(textSize);
    
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: (studyData.briefDescription ? studyData.briefDescription : 'No description'), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
      ]
    ], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    
    /* Data sharing statement */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Data Sharing Statement', currX, currY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(textSize);
    
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: (studyData.dataSharingStatement ? studyData.dataSharingStatement : 'No data sharing statement'), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
      ]
    ], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    
    /* General data */
    currY += offsetGeneral;
    currY = this.makeTable([
      [
        { content: 'Study Status', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Study Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Study Start Date', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } }
      ],
      [
        { content: studyData.studyStatus.name, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: studyData.studyType.name, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: (studyData.studyStartMonth ? this.monthNames[studyData.studyStartMonth - 1] + ' ' : this.defaultMissingValueText) + studyData.studyStartYear, 
          rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});

    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Organisation', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Min Age', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Max Age', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } }
      ],
      [
        { content: (studyData.organisation?.defaultName ? studyData.organisation.defaultName : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: (studyData.minAge ? studyData.minAge + ' ' + studyData.minAgeUnit.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: (studyData.maxAge ? studyData.maxAge + ' ' + studyData.maxAgeUnit.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});
    
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Study Gender Eligibility', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Study Enrolment', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ],
      [
        { content: (studyData.studyGenderElig?.name ? studyData.studyGenderElig?.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: (studyData.studyEnrolment ? studyData.studyEnrolment : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});

    /* Study identifiers */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Study Identifiers', currX, currY);
    
    currY += offsetT2;
    if (studyData.studyIdentifiers.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Identifier Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Identifier Value', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Identifier Organisation', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Identifier Date', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } }
        ]
      ].concat(
        studyData.studyIdentifiers.map(identifier => [
          { content: (identifier.identifierType?.name ? identifier.identifierType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (identifier.identifierValue ? identifier.identifierValue : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (identifier.identifierOrg?.defaultName ?  identifier.identifierOrg.defaultName : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (identifier.identifierDate ? identifier.identifierDate.slice(0, 10) : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Study titles */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Study Titles', currX, currY);
    
    currY += offsetT2;
    if (studyData.studyTitles.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Title Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Title Text', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Language', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } }
        ]
      ].concat(
        studyData.studyTitles.map(title => [
          { content: (title.titleType.name ? title.titleType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (title.titleText ? title.titleText : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (title.langCode?.langNameEn ? title.langCode.langNameEn : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Study topics */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Study Topics', currX, currY);
    
    currY += offsetT2;
    if (studyData.studyTopics.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Topic Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Topic Value', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Controlled Terminology', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'CT Code', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } }
        ]
      ].concat(
        studyData.studyTopics.map(topic => [
          { content: (topic.topicType.name ? topic.topicType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (topic.meshValue ? topic.meshValue : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (topic.originalValue?.name ? topic.originalValue.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (topic.meshCode ? topic.meshCode : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Study relationships */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Study Relationships', currX, currY);
    
    currY += offsetT2;
    if (studyData.studyRelationships.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Relationship Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Target Study ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Target Study Title', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } }
        ]
      ].concat(
        studyData.studyRelationships.map(relationship => [
          { content: (relationship.relationshipType?.name ? relationship.relationshipType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          //  TODO: add link to study here?
          { content: (relationship.targetStudy?.sdSid ? relationship.targetStudy?.sdSid : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (relationship.targetStudy?.displayTitle ? relationship.targetStudy?.displayTitle : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Study contributors */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Study Contributors', currX, currY);
    
    currY += offsetT2;
    if (studyData.studyContributors.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Is An Individual?', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Person', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Contributor Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Organisation', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } }
        ]
      ].concat(
        studyData.studyContributors.map(contributor => [
          { content: (contributor.isIndividual ? 'Yes' : 'No'), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          // Displaying name if it is a person, N/A otherwise
          { content: (
            contributor.isIndividual ? 
              (contributor.person?.firstName || contributor.person?.lastName ? 
                (contributor.person.firstName + ' ' + contributor.person?.lastName).trim() : this.defaultMissingValueText)
            : 'N/A'
          ), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (contributor.contributorType?.name ? contributor.contributorType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (contributor.organisation?.defaultName ? contributor.organisation.defaultName : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Study features */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Study Features', currX, currY);

    currY += offsetT2;
    if (studyData.studyFeatures.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Feature Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Feature Value', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } }
        ]
      ].concat(
        studyData.studyFeatures.map(feature => [
          { content: (feature.featureType?.name ? feature.featureType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (feature.featureValue?.name ? feature.featureValue.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    doc.save(studyData.displayTitle + '.pdf');
  }

  objectPdfGenerator(objectData) {
    const doc = new jsPDF();

    const isShowTopicType = true;
    const offsetX = 16;
    const offsetY = 25;
    const offsetT1 = 10;
    const offsetT2 = 6;
    const offsetT3 = 8; // Bigger offset between object instances
    const offsetLinkedTables = 4; // Used for object instances tables
    const offsetSection = 14;

    const t1Size = 18;
    const t2Size = 15;
    const t3Size = 12;
    const t4Size = 11;
    const textSize = 10;

    let currX = offsetX;
    let currY = offsetY;

    /* Title */
    doc.setFont(undefined, 'bold');
    doc.setFontSize(t1Size);
    doc.text(objectData.displayTitle, currX, currY);

    /* Data object ID */
    currY += offsetT1;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Object ID', currX, currY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(textSize);
    
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: (objectData.sdOid ? objectData.sdOid : 'Missing object ID'), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
      ]
    ], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    
    /* General data */
    currY += offsetSection;
    currY = this.makeTable([
      [
        { content: 'Parent Study ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Parent Study Title', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ],
      [
        { content: objectData.linkedStudy?.sdSid ? objectData.linkedStudy.sdSid : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.linkedStudy?.displayTitle ? objectData.linkedStudy.displayTitle : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});
    
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Organisation', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'DOI', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Version', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ],
      [
        { content: objectData.organisation?.defaultName ? objectData.organisation.defaultName : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.doi ? objectData.doi : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.version ? objectData.version : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});

    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Object Class', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Object Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ],
      [
        { content: objectData.objectClass?.name ? objectData.objectClass.name : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.objectType?.name ? objectData.objectType.name : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});

    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Publication Year', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Language', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ],
      [
        { content: objectData.publicationYear ? objectData.publicationYear : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.langCode?.langNameEn ? objectData.langCode.langNameEn : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});
    
    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Access Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Embargo Expiry Date', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ],
      [
        { content: objectData.accessType?.name ? objectData.accessType.name : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.embargoExpiry ? objectData.embargoExpiry.slice(0, 10) : 'No embargo', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});
    
    // If object class is dataset
    if (objectData.objectDatasets.length > 0) {

      /* Dataset record keys */
      currY += offsetSection;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(t2Size);
      doc.text('Dataset Anonymisation Status', currX, currY);

      currY += offsetT2;
      currY = this.makeTable([
        [
          { content: 'Anonymisation Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ],
        [
          { content: objectData.objectDatasets[0]?.recordkeyType?.name ? objectData.objectDatasets[0].recordkeyType.name : this.defaultMissingValueText, 
            rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ],
      ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});
      
      currY += offsetT2;
      currY = this.makeTable([
        [
          { content: 'Anonymisation Details', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ],
        [
          { content: objectData.objectDatasets[0]?.recordkeyDetails ? objectData.objectDatasets[0].recordkeyDetails : 'No details provided', 
            rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ],
      ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});
    }
    
    /* Dataset consent */
    currY += offsetSection;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(t2Size);
    doc.text('Dataset Consent', currX, currY);

    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Noncommercial Only', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Geographic Restrictions', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ],
      [
        { content: objectData.objectDatasets[0]?.consentType?.name ? objectData.objectDatasets[0]?.consentType.name : this.defaultMissingValueText, 
          rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.objectDatasets[0]?.consentNoncommercial ? 'Yes' : 'No', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.objectDatasets[0]?.consentGeogRestrict ? 'Yes' : 'No', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});

    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Research Type Related', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'Genetic Research Only', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        { content: 'No Methods', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ],
      [
        { content: objectData.objectDatasets[0]?.consentResearchType ? 'Yes' : 'No', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.objectDatasets[0]?.consentGeneticOnly ? 'Yes' : 'No', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        { content: objectData.objectDatasets[0]?.consentNoMethods ? 'Yes' : 'No', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});

    currY += offsetT2;
    currY = this.makeTable([
      [
        { content: 'Details', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
      ],
      [
        { content: objectData.objectDatasets[0]?.consentDetails ? objectData.objectDatasets[0].consentDetails : 'No details provided', 
          rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
      ],
    ], doc, currX, currY, 'plain', {cellPadding: 0.5}, {});

    /* Object instances */
    currY += offsetSection;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(t2Size);
    doc.text('Object Instances', currX, currY);

    currY += offsetT3;
    if (objectData.objectInstances.length > 0) {
      objectData.objectInstances.forEach(instance => {
        currY = this.makeTable([
          [
            { content: (instance.resourceType?.name ? instance.resourceType.name : 'Unknown type') + ': '
              + (instance.repository ? instance.repository : 'Unknown repository'), 
              rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t4Size } },
          ]
        ]
        , doc, currX, currY, 'plain', {cellPadding: 0}, {});

        currY += offsetLinkedTables;
        currY = this.makeTable([
          [
            { content: 'Repository', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: textSize } },
          ],
          [
            { content: instance.repository ? instance.repository : this.defaultMissingValueText, 
              rowSpan: 1, styles: { halign: 'left', fontStyle: 'normal', fontSize: textSize } },
          ]
        ]
        , doc, currX, currY, 'grid', {}, {});

        currY += offsetLinkedTables;
        // TODO: make URL clickable: https://github.com/simonbengtsson/jsPDF-AutoTable/issues/167
        currY = this.makeTable([
          [
            { content: 'Access Details: Direct Access', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t4Size } },
            { content: 'Access Details: URL', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t4Size } },
          ],
          [
            { content: instance.urlAccessible ? 'Yes' : 'No', rowSpan: 1, styles: { halign: 'left', fontStyle: 'normal', fontSize: textSize } },
            { content: instance.url ? instance.url : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontStyle: 'normal', fontSize: textSize } },
          ]
        ]
        , doc, currX, currY, 'grid', {}, {});

        currY += offsetLinkedTables;
        currY = this.makeTable([
          [
            { content: 'Resource Details: Resource Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t4Size } },
            { content: 'Resource Details: Size', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t4Size } },
          ],
          [
            { content: instance.resourceType?.name ? instance.resourceType.name : this.defaultMissingValueText, rowSpan: 1, styles: { halign: 'left', fontStyle: 'normal', fontSize: textSize } },
            { content: (instance.resourceSize + (instance.resourceSizeUnit?.name ? ' ' + instance.resourceSizeUnit.name : this.defaultMissingValueText)), 
              rowSpan: 1, styles: { halign: 'left', fontStyle: 'normal', fontSize: textSize } },
          ]
        ]
        , doc, currX, currY, 'grid', {}, {});

        currY += offsetLinkedTables;
        currY = this.makeTable([
          [
            { content: 'Comments', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t4Size } },
          ],
          [
            { content: instance.resourceComments ? instance.resourceComments : 'No comments', 
              rowSpan: 1, styles: { halign: 'left', fontStyle: 'normal', fontSize: textSize } },
          ]
        ]
        , doc, currX, currY, 'grid', {}, {});

        currY += offsetT3;
      });
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Object titles */
    currY += offsetSection;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(t2Size);
    doc.text('Object Titles', currX, currY);

    currY += offsetT2;
    if (objectData.objectTitles.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Title Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Language', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Title Text', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ]
      ].concat(
        objectData.objectTitles.map(title => [
          { content: (title.titleType?.name ? title.titleType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (title.langCode?.langNameEn ? title.langCode.langNameEn : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (title.titleText ?  title.titleText : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Object dates */
    currY += offsetSection;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(t2Size);
    doc.text('Object Dates', currX, currY);

    currY += offsetT2;
    if (objectData.objectDates.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Date Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Date range?', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Start Date', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'End Date', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ]
      ].concat(
        objectData.objectDates.map(date => [
          { content: (date.dateType?.name ? date.dateType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (date.dateIsRange ? 'Yes' : 'No'), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (date.startYear ? date.startYear : this.defaultMissingValueText) + '-' 
                      + (date.startMonth ? date.startMonth : this.defaultMissingValueText) + '-' 
                      + (date.startDay ? date.startDay : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (date.dateIsRange ? 
                      ((date.endYear ? date.endYear : this.defaultMissingValueText) + '-' 
                      + (date.endMonth ? date.endMonth : this.defaultMissingValueText) + '-' 
                      + (date.endDay ? date.endDay : this.defaultMissingValueText)) : 'N/A'), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Object contributors */
    currY += offsetSection;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(t2Size);
    doc.text('Object Contributors', currX, currY);

    currY += offsetT2;
    if (objectData.objectContributors.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Is An Individual?', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Person', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Contributor Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Organisation', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } }
        ]
      ].concat(
        objectData.objectContributors.map(contributor => [
          { content: (contributor.isIndividual ? 'Yes' : 'No'), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          // Displaying name if it is a person, N/A otherwise
          { content: (
            contributor.isIndividual ? 
              (contributor.person?.firstName || contributor.person?.lastName ? 
                (contributor.person.firstName + ' ' + contributor.person?.lastName).trim() : this.defaultMissingValueText)
            : 'N/A'
          ), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (contributor.contributorType?.name ? contributor.contributorType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (contributor.organisation?.defaultName ? contributor.organisation.defaultName : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: isShowTopicType ? 'None': 'N/A', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Object topics */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Object Topics', currX, currY);
    
    currY += offsetT2;
    if (objectData.objectTopics.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Topic Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Topic Value', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Controlled Terminology', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'CT Code', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Mesh Coded', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } }
        ]
      ].concat(
        objectData.objectTopics.map(topic => [
          { content: (topic.topicType.name ? topic.topicType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (topic.meshValue ? topic.meshValue : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (topic.originalValue?.name ? topic.originalValue.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (topic.meshCode ? topic.meshCode : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (topic.meshCoded ? 'Yes' : 'No'), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: isShowTopicType ? 'None': 'N/A', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Object identifiers */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Object Identifiers', currX, currY);
    
    currY += offsetT2;
    if (objectData.objectIdentifiers.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Identifier Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Identifier Value', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Identifier Organisation', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Identifier Date', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } }
        ]
      ].concat(
        objectData.objectIdentifiers.map(identifier => [
          { content: (identifier.identifierType?.name ? identifier.identifierType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (identifier.identifierValue ? identifier.identifierValue : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (identifier.identifierOrg?.defaultName ?  identifier.identifierOrg.defaultName : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (identifier.identifierDate ? identifier.identifierDate.slice(0, 10) : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Object descriptions */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Object Descriptions', currX, currY);
    
    currY += offsetT2;
    if (objectData.objectDescriptions.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Description Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Description Label', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Description Text', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Language Code', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } }
        ]
      ].concat(
        objectData.objectDescriptions.map(description => [
          { content: (description.descriptionType?.name ? description.descriptionType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (description.label ? description.label : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (description.descriptionText ? description.descriptionText : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (description.langCode?.langNameEn ? description.langCode.langNameEn : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Object rights */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Object Rights', currX, currY);
    
    currY += offsetT2;
    if (objectData.objectRights.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Rights Name', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Rights URL', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
          { content: 'Comments', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', fontSize: t3Size } },
        ]
      ].concat(
        objectData.objectRights.map(rights => [
          { content: (rights.rightsName ? rights.rightsName : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          // TODO: make URL clickable: https://github.com/simonbengtsson/jsPDF-AutoTable/issues/167
          { content: (rights.rightsUrl ? rights.rightsUrl : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (rights.comments ? rights.comments : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
        ])
      )
      , doc, currX, currY, 'grid', {}, {0: {cellWidth: 30}, 1: {cellWidth: 60}, 2: {cellWidth: 90}});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    /* Object relationships */
    currY += offsetSection;
    doc.setFontSize(t2Size);
    doc.setFont(undefined, 'bold');
    doc.text('Object Relationships', currX, currY);
    
    currY += offsetT2;
    if (objectData.objectRelationships.length > 0) {
      currY = this.makeTable([
        [
          { content: 'Relationship Type', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Target Object ID', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } },
          { content: 'Target Object Title', rowSpan: 1, styles: { halign: 'left', fontStyle: 'bold', cellWidth: 'auto', fontSize: t3Size } }
        ]
      ].concat(
        objectData.objectRelationships.map(relationship => [
          { content: (relationship.relationshipType?.name ? relationship.relationshipType.name : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (relationship.targetObject?.sdOid ? relationship.targetObject.sdOid : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } },
          { content: (relationship.targetObject?.displayTitle ? relationship.targetObject.displayTitle : this.defaultMissingValueText), rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }
        ])
      )
      , doc, currX, currY, 'grid', {}, {});
    } else {
      currY = this.makeTable([[{ content: 'None', rowSpan: 1, styles: { halign: 'left', fontSize: textSize } }]], doc, currX, currY, 'plain', {cellPadding: 0}, {});
    }

    doc.save(objectData.displayTitle + '.pdf');
  }
}
