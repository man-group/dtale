import { TFunction } from 'i18next';

import { BaseOption } from '../../../redux/state/AppState';

export const aggregationOpts = (t: TFunction): Array<BaseOption<string>> => [
  { value: 'count', label: t('constants:Count') },
  { value: 'nunique', label: t('Unique Count', { ns: 'constants' }) },
  { value: 'sum', label: t('constants:Sum') },
  { value: 'mean', label: t('constants:Mean') },
  { value: 'rolling', label: t('constants:Rolling') },
  { value: 'first', label: t('Keep First', { ns: 'constants' }) },
  { value: 'last', label: t('Keep Last', { ns: 'constants' }) },
  { value: 'median', label: t('constants:Median') },
  { value: 'min', label: t('constants:Minimum') },
  { value: 'max', label: t('constants:Maximum') },
  { value: 'std', label: t('Standard Deviation', { ns: 'constants' }) },
  { value: 'var', label: t('constants:Variance') },
  { value: 'mad', label: t('Mean Absolute Deviation', { ns: 'constants' }) },
  { value: 'prod', label: t('Product of All Items', { ns: 'constants' }) },
];

export const pivotAggs = (t: TFunction): Array<BaseOption<string>> =>
  aggregationOpts(t).filter((option) => option.value !== 'rolling');

export const rollingComps = (t: TFunction): Array<BaseOption<string>> => [
  { value: 'corr', label: t('constants:Correlation') },
  { value: 'count', label: t('constants:Count') },
  { value: 'cov', label: t('constants:Covariance') },
  { value: 'kurt', label: t('constants:Kurtosis') },
  { value: 'max', label: t('constants:Maximum') },
  { value: 'mean', label: t('constants:Mean') },
  { value: 'median', label: t('constants:Median') },
  { value: 'min', label: t('constants:Minimum') },
  { value: 'skew', label: t('constants:Skew') },
  { value: 'std', label: t('Standard Deviation', { ns: 'constants' }) },
  { value: 'sum', label: t('constants:Sum') },
  { value: 'var', label: t('constants:Variance') },
];

export const analysisAggs = (t: TFunction): Array<BaseOption<string>> => [
  ...pivotAggs(t),
  { value: 'pctsum', label: t('Percentage Sum', { ns: 'constants' }) },
];

export const resampleAggs = (t: TFunction): Array<BaseOption<string>> => [
  ...pivotAggs(t),
  { value: 'ohlc', label: t('OHLC', { ns: 'constants' }) },
];

export const titles = (t: TFunction): Record<string, string> => ({
  histogram: t('Histogram', { ns: 'constants' }),
  value_counts: t('Value Counts', { ns: 'constants' }),
  boxplot: t('Describe', { ns: 'constants' }),
  categories: t('Categories', { ns: 'constants' }),
  word_value_counts: t('Word Value Counts', { ns: 'constants' }),
  geolocation: t('Geolocation', { ns: 'constants' }),
  qq: t('Q-Q Plot', { ns: 'constants' }),
  frequency: t('Frequency Table', { ns: 'constants' }),
});

export const sortOptions = (a: BaseOption<string>, b: BaseOption<string>): number =>
  a.value.toLowerCase().localeCompare(b.value.toLowerCase());
