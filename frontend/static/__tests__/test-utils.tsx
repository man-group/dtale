/* eslint max-classes-per-file: "off" */
import { act, fireEvent, Matcher, screen } from '@testing-library/react';
import {
  ChartConfiguration,
  ChartData,
  ChartEvent,
  ChartMeta,
  ChartOptions,
  ChartType,
  DefaultDataPoint,
  InteractionItem,
  Scale,
} from 'chart.js';
import { TFunction } from 'i18next';
import * as React from 'react';
import selectEvent from 'react-select-event';
import { Store } from 'redux';

import * as chartUtils from '../chartUtils';

export const parseUrlParams = (url?: string): Record<string, string> =>
  JSON.parse(
    '{"' +
      decodeURI((url ?? '').split('?')[1])
        .replace(/"/g, '\\"')
        .replace(/&/g, '","')
        .replace(/=/g, '":"') +
      '"}',
  );

export const replaceNBSP = (text: string): string => text.replace(/\s/g, ' ');

export const logException = (e: Error): void => {
  console.error(`${e.name}: ${e.message} (${(e as any).fileName}:${(e as any).lineNumber})`); // eslint-disable-line no-console
  console.error(e.stack); // eslint-disable-line no-console
};

const BASE_SETTINGS = '{&quot;sortInfo&quot;:[[&quot;col1&quot;,&quot;ASC&quot;]],&quot;precision&quot;:2}';
const HIDE_SHUTDOWN = 'False';
const PROCESSES = 1;
const IFRAME = 'False';
const DATA_ID = 1;

export const PREDEFINED_FILTERS = [
  '[{',
  '&quot;name&quot;:&quot;custom_foo&quot;,',
  '&quot;column&quot;:&quot;foo&quot;,',
  '&quot;description&quot;:&quot;foo&quot;,',
  '&quot;inputType&quot;: &quot;input&quot;',
  '}]',
].join('');

const buildHidden = (id: string, value: string | number): string =>
  `<input type="hidden" id="${id}" value="${value}" />`;

const BASE_HTML = `
<div id="content" style="height: 1000px;width: 1000px;" />
<div id="popup-content" />
<span id="code-title" />
`;

export const buildInnerHTML = (props: Record<string, string | undefined> = {}, store?: Store): void => {
  const actions = require('../redux/actions/dtale');
  const pjson = require('../../package.json');
  const body = document.getElementsByTagName('body')[0];
  body.innerHTML = [
    buildHidden('settings', props.settings ?? BASE_SETTINGS),
    buildHidden('version', pjson.version),
    buildHidden('python_version', props.pythonVersion ?? '3.8.0'),
    buildHidden('hide_shutdown', props.hideShutdown ?? HIDE_SHUTDOWN),
    buildHidden('hide_drop_rows', props.hideDropRows ?? 'False'),
    buildHidden('processes', props.processes ?? PROCESSES),
    buildHidden('iframe', props.iframe ?? IFRAME),
    buildHidden('data_id', props.dataId ?? DATA_ID),
    buildHidden('xarray', props.xarray ?? 'False'),
    buildHidden('xarray_dim', props.xarrayDim ?? '{}'),
    buildHidden('allow_cell_edits', props.allowCellEdits ?? 'True'),
    buildHidden('is_vscode', props.isVSCode ?? 'False'),
    buildHidden('theme', props.theme ?? 'light'),
    buildHidden('language', props.language ?? 'en'),
    buildHidden('pin_menu', props.pinMenu ?? 'False'),
    buildHidden('filtered_ranges', props.filteredRanges ?? JSON.stringify({})),
    buildHidden('auth', props.auth ?? 'False'),
    buildHidden('username', props.username ?? ''),
    buildHidden('predefined_filters', props.predefinedFilters ?? '[]'),
    buildHidden('max_column_width', props.maxColumnWidth ?? 'None'),
    buildHidden('main_title', props.mainTitle ?? ''),
    buildHidden('main_title_font', props.mainTitleFont ?? ''),
    buildHidden('query_engine', props.queryEngine ?? 'python'),
    buildHidden('hide_header_editor', props.hideHeaderEditor ?? HIDE_SHUTDOWN),
    BASE_HTML,
  ].join('');
  store?.dispatch(actions.init());
};

export const findMainMenuButton = (name: string, btnTag = 'button'): Element | undefined => {
  const menu = screen.getByTestId('data-viewer-menu');
  const buttons = menu.querySelectorAll(`ul li ${btnTag}`);
  return [...buttons].find((b) => b?.textContent?.includes(name));
};

export const clickMainMenuButton = async (name: string, btnTag = 'button'): Promise<void> => {
  await act(async () => {
    fireEvent.click(findMainMenuButton(name, btnTag)!);
  });
};

export const tick = (timeout = 0): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

/** Mocked version of chart.js Chart object */
export class MockChart {
  /** @override */
  public static register = (): void => undefined;

  public ctx: HTMLCanvasElement;
  public cfg: ChartConfiguration;
  public config: { _config: ChartConfiguration };
  public data: ChartData;
  public destroyed: boolean;
  public options: ChartOptions;

  /** @override */
  constructor(ctx: HTMLCanvasElement, cfg: ChartConfiguration) {
    this.ctx = ctx;
    this.cfg = cfg;
    this.config = { _config: cfg };
    this.data = cfg.data;
    this.destroyed = false;
    this.options = cfg.options ?? { scales: { x: {}, y: {} } };
  }

  /** @override */
  public destroy(): void {
    this.destroyed = true;
  }

  /** @override */
  public getElementsAtEventForMode(_evt: ChartEvent): InteractionItem[] {
    return [
      {
        datasetIndex: 0,
        index: 0,
        _chart: { config: { _config: this.cfg }, data: this.cfg.data },
      } as any as InteractionItem,
    ];
  }

  /** @override */
  public getDatasetMeta(idx: number): ChartMeta {
    return { controller: { _config: { selectedPoint: 0 } } } as any as ChartMeta;
  }

  /** @override */
  public update(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
}

export const mockChartJS = (): void => {
  jest.mock('chart.js', () => ({ Chart: MockChart }));
};

export const mockD3Cloud = (): void => {
  jest.mock('d3-cloud', () => () => {
    const cloudCfg: any = {};
    const propUpdate =
      (prop: string): ((val: string) => any) =>
      (val: string): any => {
        cloudCfg[prop] = val;
        return cloudCfg;
      };
    cloudCfg.size = propUpdate('size');
    cloudCfg.padding = propUpdate('padding');
    cloudCfg.words = propUpdate('words');
    cloudCfg.rotate = propUpdate('rotate');
    cloudCfg.spiral = propUpdate('spiral');
    cloudCfg.random = propUpdate('random');
    cloudCfg.text = propUpdate('text');
    cloudCfg.font = propUpdate('font');
    cloudCfg.fontStyle = propUpdate('fontStyle');
    cloudCfg.fontWeight = propUpdate('fontWeight');
    cloudCfg.fontSize = () => ({
      on: () => ({ start: () => undefined }),
    });
    return cloudCfg;
  });
};

export const mockWordcloud = (): void => {
  jest.mock('react-wordcloud', () => {
    const { createMockComponent } = require('./mocks/createMockComponent');
    return {
      __esModule: true,
      default: createMockComponent('MockWordcloud', () => <div data-testid="mock-wordcloud" />),
    };
  });
};

export const mockT = ((key: string): string => {
  const keySegs = key.split(':');
  if (keySegs.length > 2) {
    keySegs.shift();
    return keySegs.join(':');
  } else if (keySegs.length === 2) {
    return keySegs[keySegs.length - 1];
  }
  return key;
}) as any as TFunction;

/** Type definition for chartUtils.createChart spies */
export type CreateChartSpy = jest.SpyInstance<
  chartUtils.ChartObj,
  [ctx: HTMLCanvasElement, cfg: ChartConfiguration<ChartType, DefaultDataPoint<ChartType>, unknown>]
>;

export const getLastChart = (
  spy: CreateChartSpy,
  chartType?: string,
): ChartConfiguration<ChartType, DefaultDataPoint<ChartType>, unknown> => {
  if (chartType) {
    const typeCalls = spy.mock.calls.filter((call) => call[1].type === chartType);
    return typeCalls[typeCalls.length - 1][1];
  }
  return spy.mock.calls[spy.mock.calls.length - 1][1];
};

export const buildChartContext = (): Partial<CanvasRenderingContext2D> => ({
  createLinearGradient: (_px1: number, _px2: number, _px3: number, _px4: number): CanvasGradient => ({
    addColorStop: (_px5: number, _color: string): void => undefined,
  }),
  save: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  lineWidth: 0,
  strokeStyle: undefined,
  stroke: jest.fn(),
  restore: jest.fn(),
});

export const SCALE: Partial<Scale> = { getPixelForValue: (px: number): number => px };

/** FakeMouseEvent properties */
interface MouseEventWithOffsets extends MouseEventInit {
  pageX?: number;
  pageY?: number;
  offsetX?: number;
  offsetY?: number;
  x?: number;
  y?: number;
}

/** Fake mouse event class */
export class FakeMouseEvent extends MouseEvent {
  /** @override */
  constructor(type: string, values: MouseEventWithOffsets) {
    const { pageX, pageY, offsetX, offsetY, x, y, ...mouseValues } = values;
    super(type, mouseValues);

    Object.assign(this, {
      offsetX: offsetX || 0,
      offsetY: offsetY || 0,
      pageX: pageX || 0,
      pageY: pageY || 0,
      x: x || 0,
      y: y || 0,
    });
  }
}

export const selectOption = async (selectElement: HTMLElement, option: Matcher | Matcher[]): Promise<void> => {
  await act(async () => {
    await selectEvent.openMenu(selectElement);
  });
  await act(async () => {
    await selectEvent.select(selectElement, option);
  });
};
