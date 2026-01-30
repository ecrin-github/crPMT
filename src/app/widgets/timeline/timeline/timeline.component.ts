import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import type { EChartsCoreOption } from 'echarts/core';
import { ngbDateToString } from 'src/assets/js/util';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {  // Note: for now this component is specific to Reporting Periods
  @Input() data: any;

  options: EChartsCoreOption;
  tooltipHTML: string = "";

  constructor() { }

  ngOnInit(): void { }

  // Custom tooltip to show only on mouse over line (pixels)
  onMouseEvent(params) {
    if (params?.type === "mouseover" && params?.componentSubType == "line") {
      const color = params?.event?.target?.style?.stroke;

      let html = '';
      html += params?.seriesName;
      html += "<br>";
      // Taken from default Tooltip style
      html += `<span style='display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};'></span>`;
      html += `<span style='font-weight:900;'>${this.data[params.seriesIndex]?.start}</span>`;
      html += " - ";
      html += `<span style='font-weight:900;'>${this.data[params.seriesIndex]?.end}</span>`;

      if (this.data[params.seriesIndex]?.comment) {
        html += `<br>`;
        // Taken from default Tooltip style
        html += `<span style='display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};'></span>`;
        html += `<span>Comment</span>: `;
        html += `<span>${this.data[params.seriesIndex]?.comment}</span>`;
      }

      this.tooltipHTML = html;
    } else {
      this.tooltipHTML = "";
    }
  }

  setOptions() {
    // TODO: add data view in toolbox?
    // TODO: handle long comments in tooltip (line breaks)
    // TODO: handle missing start/end dates?

    // Converting nbgDates to yyyy-mm-dd
    this.data.map((rp) => {
      rp.start = ngbDateToString(rp.start);
      rp.end = ngbDateToString(rp.end);
    });

    this.options = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params) => { return this.tooltipHTML; }
      },
      // "Padding" around chart
      grid: {
        left: '5%',
        right: '10%',
        bottom: '10%',
        top: '15%'
      },
      // Time axis
      xAxis: {
        type: 'time',
        show: true,
        axisLine: { show: true },
        position: 'bottom',
        min: 'dataMin',
        max: 'dataMax',
        axisLabel: {
          showMinLabel: true,
          showMaxLabel: true,
          formatter: {  // Fix for formatting with min/max dates
            year: '{yyyy}',
            month: '{yyyy}-{MM}',
            day: '{yyyy}-{MM}-{dd}',
            hour: '{yyyy}-{MM}-{dd}',
            minute: '{yyyy}-{MM}-{dd}',
            second: '{yyyy}-{MM}-{dd}',
            // hour: '{hh}:{mm}',
            // minute: '{hh}:{mm}:{ss}',
            // second: '{hh}:{mm}:{ss}',
            millisecond: '{yyyy}-{MM}-{dd}',
            none: '{yyyy}-{MM}-{dd} {hh}:{mm}:{ss} {SSS}'
          }
        },
        axisTick: { // Ticks for dates
          show: true,
          length: 6,
          lineStyle: {
            color: '#333',
            width: 2,
            type: 'solid'
          }
        }
      },
      // Reporting period axis
      yAxis: {
        type: 'category',
        triggerEvent: true,
        inverse: true,
        name: "Reporting Period",
        nameLocation: "start",
        data: this.data.map((rp) => {
          return "RP " + rp?.stage;
        })
      },
      // Tools on the right
      toolbox: {
        orient: "vertical",
        right: "0%",
        feature: {
          // dataView: { show: true, readOnly: false },
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {},
        }
      },
      dataZoom: [
        {
          type: 'inside',
          filterMode: 'none'  // Otherwise lines break on Zoom
        },
      ],
      // Populating series data
      series: this.data.map((rp) => {
        return {
          name: "Reporting Period " + rp?.stage,
          type: 'line',
          symbol: 'rect',
          symbolSize: 0,
          showSymbol: false,
          itemStyle: { opacity: 0 },
          triggerLineEvent: true,
          // showSymbol: false,
          lineStyle: {
            width: 20
          },
          encode: {
            x: 0,
            y: 1
          },
          data: [[rp.start, rp?.stage - 1], [rp.end, rp?.stage - 1]],
          // "Today" vertical line
          markLine: {
            silent: true,  // Deactivate tooltip
            symbol: ['none', 'none'],
            label: {
              position: "start",
              formatter: function (params) {
                return "Today";
              }
            },
            data: [{
              name: 'Today',
              xAxis: new Date(),
            }]
          }
        };
      })
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data) {
      if (!this.data) {
        this.data = [];
      } else {
        this.setOptions();
      }
    }
  }
}
