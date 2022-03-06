import { Edge, Node } from 'vis-network';

import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Node properties from axios resposne */
interface NetworkDataResponseNode extends Node {
  id: string;
  label: string;
  group: string;
  color: string;
  title?: string;
}

/** Edge properties from axios response */
export interface NetworkDataResponseEdge extends Edge {
  to: string;
  from: string;
  value?: number;
  title?: string;
}

/** Axios response for network data */
export interface NetworkDataResponse extends GenericRepository.BaseResponse {
  nodes: NetworkDataResponseNode[];
  edges: NetworkDataResponseEdge[];
  groups: Record<string, string>;
}

/**
 * Load network data.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param params the URL parameters for the network data endpoint.
 * @return network data.
 */
export async function getData(
  dataId: string,
  params: Record<string, string>,
): Promise<NetworkDataResponse | undefined> {
  return await GenericRepository.getDataFromService<NetworkDataResponse>(
    buildURLString(`/dtale/network-data/${dataId}?`, params),
  );
}

/** Axios response for fetching ShortestPath data */
export interface ShortestPathResponse extends GenericRepository.BaseResponse {
  data: string[];
}

/**
 * Load shortest path between two nodes.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param params the URL parameters for the shortest path endpoint.
 * @return list of node ids that comprise the shortest path between them.
 */
export async function shortestPath(
  dataId: string,
  params: Record<string, string>,
): Promise<ShortestPathResponse | undefined> {
  return await GenericRepository.getDataFromService<ShortestPathResponse>(
    buildURLString(`/dtale/shortest-path/${dataId}?`, params),
  );
}

/** NetworkX data analysis of network  */
export interface Analysis {
  node_ct: number;
  triangle_ct: number;
  most_connected_node: string;
  leaf_ct: number;
  edge_ct: number;
  max_edge?: string;
  min_edge?: string;
  avg_weight: number;
}

/** Axios response containing NetworkX analysis */
interface AnalysisResponse extends GenericRepository.BaseResponse {
  data: Analysis;
}

/**
 * Load networkx analysis of network data.
 *
 * @param dataId the identifier of the data instance you would like the data types for.
 * @param params the URL parameters for the network analysis endpoint.
 * @return networkx analysis.
 */
export async function analysis(dataId: string, params: Record<string, string>): Promise<AnalysisResponse | undefined> {
  return await GenericRepository.getDataFromService<AnalysisResponse>(
    buildURLString(`/dtale/network-analysis/${dataId}?`, params),
  );
}
