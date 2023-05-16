import { buildURLString } from '../redux/actions/url-utils';

import * as GenericRepository from './GenericRepository';

/** Axios response for loading libraries */
export interface LibrariesResponse extends GenericRepository.BaseResponse {
  libraries: string[];
  library?: string;
}

/** Axios response for loading symbols */
export interface SymbolsResponse extends GenericRepository.BaseResponse {
  symbols: string[];
}

/** Axios response for loading symbol */
export interface LoadDescriptionResponse extends GenericRepository.BaseResponse {
  description: string;
  symbol: string;
}

/** Axios response for loading symbol */
export interface LoadSymbolResponse extends GenericRepository.BaseResponse {
  data_id: string;
}

/**
 * Load libraries for the current ArcticDB host.
 *
 * @param refresh if true, refresh the cached libraries when fetching
 * @return libraries.
 */
export async function libraries(refresh?: boolean): Promise<LibrariesResponse | undefined> {
  return await GenericRepository.getDataFromService<LibrariesResponse>(
    buildURLString('/dtale/arcticdb/libraries', { refresh: `${refresh}` }),
  );
}

/**
 * Load symbols for the current ArcticDB library.
 *
 * @param library the library we want to load symbols for.
 * @param refresh if true, refresh the cached symbols when fetching
 * @return symbols.
 */
export async function symbols(library: string, refresh?: boolean): Promise<SymbolsResponse | undefined> {
  return await GenericRepository.getDataFromService<SymbolsResponse>(
    buildURLString(`/dtale/arcticdb/${library}/symbols`, { refresh: `${refresh}` }),
  );
}

/**
 * Load description for library/symbol in the current ArcticDB host.
 *
 * @param library the library we want to choose.
 * @param symbol the symbol want to load.
 * @return description.
 */
export async function loadDescription(library: string, symbol: string): Promise<LoadDescriptionResponse | undefined> {
  return await GenericRepository.getDataFromService<LoadDescriptionResponse>(
    buildURLString('/dtale/arcticdb/load-description', { library, symbol }),
  );
}

/**
 * Load library/symbol for the current ArcticDB host.
 *
 * @param library the library we want to choose.
 * @param symbol the symbol want to load.
 * @return success or failure.
 */
export async function loadSymbol(library: string, symbol: string): Promise<LoadSymbolResponse | undefined> {
  return await GenericRepository.getDataFromService<LoadSymbolResponse>(
    buildURLString('/dtale/arcticdb/load-symbol', { library, symbol }),
  );
}
