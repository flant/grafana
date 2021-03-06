import _ from 'lodash';
import { alignOptions, aggOptions, ValueTypes, MetricKind, systemLabels } from './constants';
import { SelectableValue } from '@grafana/data';
import StackdriverDatasource from './datasource';
import { TemplateSrv } from 'app/features/templating/template_srv';
import { StackdriverQuery, MetricDescriptor } from './types';

export const extractServicesFromMetricDescriptors = (metricDescriptors: MetricDescriptor[]) =>
  _.uniqBy(metricDescriptors, 'service');

export const getMetricTypesByService = (metricDescriptors: MetricDescriptor[], service: string) =>
  metricDescriptors.filter((m: MetricDescriptor) => m.service === service);

export const getMetricTypes = (
  metricDescriptors: MetricDescriptor[],
  metricType: string,
  interpolatedMetricType: string,
  selectedService: string
) => {
  const metricTypes = getMetricTypesByService(metricDescriptors, selectedService).map((m: any) => ({
    value: m.type,
    name: m.displayName,
  }));
  const metricTypeExistInArray = metricTypes.some(
    (m: { value: string; name: string }) => m.value === interpolatedMetricType
  );
  const selectedMetricType = metricTypeExistInArray ? metricType : metricTypes[0].value;
  return {
    metricTypes,
    selectedMetricType,
  };
};

export const getAlignmentOptionsByMetric = (metricValueType: string, metricKind: string) => {
  return !metricValueType
    ? []
    : alignOptions.filter(i => {
        return (
          i.valueTypes.indexOf(metricValueType as ValueTypes) !== -1 &&
          i.metricKinds.indexOf(metricKind as MetricKind) !== -1
        );
      });
};

export const getAggregationOptionsByMetric = (valueType: ValueTypes, metricKind: MetricKind) => {
  return !metricKind
    ? []
    : aggOptions.filter(i => {
        return i.valueTypes.indexOf(valueType) !== -1 && i.metricKinds.indexOf(metricKind) !== -1;
      });
};

export const getLabelKeys = async (
  datasource: StackdriverDatasource,
  selectedMetricType: string,
  projectName: string
) => {
  const refId = 'handleLabelKeysQuery';
  const labels = await datasource.getLabels(selectedMetricType, refId, projectName);
  return [...Object.keys(labels), ...systemLabels];
};

export const getAlignmentPickerData = (
  { valueType, metricKind, perSeriesAligner }: Partial<StackdriverQuery>,
  templateSrv: TemplateSrv
) => {
  const alignOptions = getAlignmentOptionsByMetric(valueType!, metricKind!).map(option => ({
    ...option,
    label: option.text,
  }));
  if (!alignOptions.some((o: { value: string }) => o.value === templateSrv.replace(perSeriesAligner!))) {
    perSeriesAligner = alignOptions.length > 0 ? alignOptions[0].value : '';
  }
  return { alignOptions, perSeriesAligner };
};

export const labelsToGroupedOptions = (groupBys: string[]) => {
  const groups = groupBys.reduce((acc: any, curr: string) => {
    const arr = curr.split('.').map(_.startCase);
    const group = (arr.length === 2 ? arr : _.initial(arr)).join(' ');
    const option = {
      value: curr,
      label: curr,
    };
    if (acc[group]) {
      acc[group] = [...acc[group], option];
    } else {
      acc[group] = [option];
    }
    return acc;
  }, {});
  return Object.entries(groups).map(([label, options]) => ({ label, options, expanded: true }), []);
};

export const toOption = (value: string) => ({ label: value, value } as SelectableValue<string>);
