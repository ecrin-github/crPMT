import {DtpMetricsResponseInterface} from './dtp-metrics-response.interface';
import {DupMetricsResponseInterface} from './dup-metrics-response.interface';
import {StudyMetricsResponseInterface} from './study-metrics-response.interface';
import {ObjectMetricsResponseInterface} from './object-metrics-response.interface';

export interface MetricsResponseInterface {
    dtp: DtpMetricsResponseInterface;
    dup: DupMetricsResponseInterface;
    studies: StudyMetricsResponseInterface;
    objects: ObjectMetricsResponseInterface;
}
