import { ColumnFilter } from '../dtale/DataViewerState';

/** Type definition for URL parameters */
type UrlParameter = Record<string, string | null>;

const URL_KEYS: Record<string, (v: any) => UrlParameter> = {
  ids: (v: number[]): UrlParameter => ({ ids: v.length ? JSON.stringify(v) : null }),
  sortInfo: (v: string[][]): UrlParameter => ({ sort: v.length ? JSON.stringify(v) : null }),
  query: (v: string): UrlParameter => ({ query: v }),
  selectedCols: (v: string[]): UrlParameter => ({ cols: v.length ? JSON.stringify(v) : null }),
  selectedCol: (v: string): UrlParameter => ({ col: v }),
};

/**
 * URL parameter builder. Filters out null or undefined values and can optionally filter on property names.
 *
 * @param input input data to be converted to URL parameters.
 * @param props property names to filter down to.
 * @return key & string value mapping of URL parameters.
 */
export function buildURLParams(input?: Record<string, any>, props?: string[]): Record<string, string> {
  if (!input) {
    return {};
  }
  return Object.keys(input).reduce((res, k) => {
    let value: UrlParameter = {};
    if (props?.length) {
      if (props.includes(k)) {
        value = URL_KEYS[k]?.(input[k]) ?? { [k]: input[k] };
      }
    } else {
      value = URL_KEYS[k]?.(input[k]) ?? { [k]: input[k] };
    }

    const finalValue = Object.values(value)[0];
    if (finalValue === null || finalValue === undefined || JSON.stringify(finalValue) === '{}') {
      return res;
    }

    return { ...res, ...value };
  }, {});
}

export const buildURLString = (base: string, params: Record<string, string>): string =>
  `${base}${base.endsWith('?') ? '' : '?'}${new URLSearchParams(params).toString()}`;

export const buildURL = (base: string, state: Record<string, any>, props: string[]): string =>
  buildURLString(base, buildURLParams(state, props));

export const dtypesUrl = (dataId: string): string => `/dtale/dtypes/${dataId}`;

export const saveColFilterUrl = (dataId: string, col: string, cfg: ColumnFilter): string =>
  buildURLString(`/dtale/save-column-filter/${dataId}`, { col, cfg: JSON.stringify(cfg) });

export const toggleOutlierFilterUrl = (dataId: string): string => `/dtale/toggle-outlier-filter/${dataId}`;

export const describeUrl = (dataId: string, col: string, filtered: boolean): string =>
  buildURLString(`/dtale/describe/${dataId}`, { col, filtered: `${filtered}` });

export const outliersUrl = (dataId: string, col: string, filtered: boolean): string =>
  buildURLString(`/dtale/outliers/${dataId}`, { col, filtered: `${filtered}` });

export const columnFilterDataUrl = (dataId: string, async = false): string =>
  `/dtale/${async ? 'async-' : ''}column-filter-data/${dataId}`;

export const varianceUrl = (dataId: string, col: string, filtered: boolean): string =>
  buildURLString(`/dtale/variance/${dataId}`, { col, filtered: `${filtered}` });

export const sequentialDiffsUrl = (dataId: string): string => `/dtale/sorted-sequential-diffs/${dataId}`;

export const cleanupEndpoint = (endpoint: string): string => {
  while (endpoint.indexOf('//') > -1) {
    endpoint = endpoint.replace('//', '/');
  }
  return endpoint;
};

export const corrAnalysisUrl = (dataId: string): string => `/dtale/corr-analysis/${dataId}`;

export const gageUrl = (dataId: string, operator: string, measurements: string, filterable: boolean): string =>
  buildURLString(`/dtale/gage-rnr/${dataId}`, { operator, measurements, filterable: `${filterable}` });
