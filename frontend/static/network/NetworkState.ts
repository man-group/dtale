import * as React from 'react';
import { Color, Node } from 'vis-network';

import { ColumnDef } from '../dtale/DataViewerState';

/** Generic object storing a value */
export interface ValueHolder<T> {
  value: T;
}

/** Type definition for group/color pair */
export type GroupColor = [string, Color];

/** Properties for turning on/off different arrow types */
export interface ArrowState {
  to: boolean;
  from: boolean;
}

/** Extended node object with a hidden label */
export interface NetworkNode extends Node {
  hiddenLabel?: string;
}

/** vis-network onClick parameters */
export interface NetworkClickParameters {
  nodes: number[];
  event?: {
    srcEvent: React.MouseEvent;
  };
}

/** Component properties for NetworkDisplay */
export interface NetworkDisplayComponentProps {
  to?: string;
  from?: string;
  group?: string;
  weight?: string;
  color?: string;
}

/** Redux state properties for NetworkDisplay */
export interface NetworkDisplayReduxProps {
  dataId: string;
}

/** Base state properties for NetworkDisplay */
export interface BaseNetworkDisplayState {
  to?: ValueHolder<string>;
  from?: ValueHolder<string>;
  group?: ValueHolder<string>;
  weight?: ValueHolder<string>;
  color?: ValueHolder<string>;
}

/** State properties for NetworkDisplay */
export interface NetworkDisplayState extends BaseNetworkDisplayState {
  error?: JSX.Element;
  loadingDtypes: boolean;
  dtypes?: ColumnDef[];
  loadingData: boolean;
  hierarchy?: string;
  groups?: GroupColor[];
  shortestPath: number[];
  arrows: ArrowState;
  highlightActive: boolean;
  allNodes?: Record<string, NetworkNode>;
  params?: Record<string, string>;
}
