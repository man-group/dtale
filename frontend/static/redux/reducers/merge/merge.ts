import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { ColumnDef } from '../../../dtale/DataViewerState';
import { ErrorState } from '../../../repository/GenericRepository';
import { ConfigUpdateProps, MergeActions } from '../../actions/MergeActions';
import {
  Dataset,
  HowToMerge,
  initialDataset,
  initialMergeConfig,
  initialStackConfig,
  MergeConfig,
  MergeConfigType,
  MergeInstance,
  StackConfig,
} from '../../state/MergeState';

export const instances = createReducer<MergeInstance[]>([], (builder) =>
  builder.addCase(MergeActions.LoadInstancesAction, (state, { payload }) => payload.data ?? []),
);

export const loading = createReducer(true, (builder) => builder.addCase(MergeActions.LoadInstancesAction, () => false));

export const loadingDatasets = createReducer(false, (builder) =>
  builder
    .addCase(MergeActions.LoadingDatasetsAction, () => true)
    .addCase(MergeActions.LoadInstancesAction, () => false),
);

export const loadingError = createReducer<ErrorState | null>(null, (builder) =>
  builder
    .addCase(MergeActions.ClearErrorsAction, () => null)
    .addCase(MergeActions.LoadInstancesAction, (state, { payload }) => (payload.error ? payload : null)),
);

export const loadingMerge = createReducer(false, (builder) =>
  builder
    .addCase(MergeActions.LoadMergeAction, () => true)
    .addCase(MergeActions.LoadMergeErrorAction, () => false)
    .addCase(MergeActions.LoadMergeDataAction, () => false),
);

export const mergeError = createReducer<ErrorState | null>(null, (builder) =>
  builder
    .addCase(MergeActions.LoadMergeAction, () => null)
    .addCase(MergeActions.LoadMergeDataAction, () => null)
    .addCase(MergeActions.ClearErrorsAction, () => null)
    .addCase(MergeActions.LoadMergeErrorAction, (state, { payload }) => payload ?? null),
);

export const action = createReducer(MergeConfigType.MERGE, (builder) =>
  builder.addCase(MergeActions.UpdateMergeActionTypeAction, (state, { payload }) => payload),
);

const mergeReducers = combineReducers({
  how: createReducer<HowToMerge>(initialMergeConfig.how, (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      payload.prop === 'how' ? (payload.value as HowToMerge) : state,
    ),
  ),
  sort: createReducer<boolean>(initialMergeConfig.sort, (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      payload.prop === 'sort' ? (payload.value as boolean) : state,
    ),
  ),
  indicator: createReducer<boolean>(initialMergeConfig.indicator, (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      payload.prop === 'indicator' ? (payload.value as boolean) : state,
    ),
  ),
});

const stackReducers = combineReducers({
  ignoreIndex: createReducer<boolean>(initialStackConfig.ignoreIndex, (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      payload.prop === 'ignoreIndex' ? (payload.value as boolean) : state,
    ),
  ),
});

export const mergeConfig = createReducer<MergeConfig>(initialMergeConfig, (builder) =>
  builder
    .addCase(MergeActions.ConfigUpdateAction, (state, mergeAction) => {
      if (mergeAction.payload.action === MergeConfigType.MERGE) {
        return mergeReducers(state, mergeAction);
      }
      return state;
    })
    .addCase(MergeActions.InitAction, (state, mergeAction) => mergeReducers(state, mergeAction)),
);

export const stackConfig = createReducer<StackConfig>(initialStackConfig, (builder) =>
  builder
    .addCase(MergeActions.ConfigUpdateAction, (state, stackAction) => {
      if (stackAction.payload.action === MergeConfigType.STACK) {
        return stackReducers(state, stackAction);
      }
      return state;
    })
    .addCase(MergeActions.InitAction, (state, stackAction) => stackReducers(state, stackAction)),
);

const datasetReducers = combineReducers({
  dataId: createReducer<string | null>(null, (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      payload.prop === 'dataId' ? (payload.value as string) : state,
    ),
  ),
  index: createReducer<ColumnDef[]>([], (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      (payload.prop === 'index' ? (payload.value as ColumnDef[]) : state).map((c) => ({ ...c })),
    ),
  ),
  columns: createReducer<ColumnDef[]>([], (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      (payload.prop === 'columns' ? (payload.value as ColumnDef[]) : state).map((c) => ({ ...c })),
    ),
  ),
  suffix: createReducer<string | null>(null, (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      payload.prop === 'suffix' ? (payload.value as string) : state,
    ),
  ),
  isOpen: createReducer<boolean>(initialDataset.isOpen, (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      payload.prop === 'isOpen' ? (payload.value as boolean) : state,
    ),
  ),
  isDataOpen: createReducer<boolean>(initialDataset.isDataOpen, (builder) =>
    builder.addCase(MergeActions.ConfigUpdateAction, (state, { payload }) =>
      payload.prop === 'isDataOpen' ? (payload.value as boolean) : state,
    ),
  ),
});

export const datasets = createReducer<Dataset[]>([], (builder) =>
  builder
    .addCase(MergeActions.AddDatasetAction, (state, { payload }) => {
      return [
        ...state.map((d) => ({ ...d, isOpen: false })),
        datasetReducers(
          { ...initialDataset },
          MergeActions.ConfigUpdateAction({
            action: MergeConfigType.MERGE,
            prop: 'dataId',
            value: payload,
          } as ConfigUpdateProps<string>),
        ),
      ];
    })
    .addCase(MergeActions.RemoveDatasetAction, (state, { payload }) =>
      state.filter((_, i) => i !== payload).map((d, i) => ({ ...d, isOpen: i === state.length - 2 })),
    )
    .addCase(MergeActions.ToggleDatasetAction, (state, { payload }) =>
      state.map((d, i) => (i === payload ? { ...d, isOpen: !d.isOpen } : d)),
    )
    .addCase(MergeActions.UpdateDatasetAction, (state, { payload }) =>
      state.map((d, i) =>
        i === payload.index
          ? datasetReducers(
              { ...d },
              MergeActions.ConfigUpdateAction({
                action: MergeConfigType.MERGE,
                prop: payload.prop,
                value: payload.value,
              } as ConfigUpdateProps<string>),
            )
          : d,
      ),
    ),
);

export const showCode = createReducer(true, (builder) =>
  builder
    .addCase(MergeActions.LoadMergeDataAction, () => false)
    .addCase(MergeActions.ClearMergeDataAction, () => true)
    .addCase(MergeActions.ToggleShowCodeAction, (state) => !state),
);

export const mergeDataId = createReducer<string | null>(null, (builder) =>
  builder
    .addCase(MergeActions.LoadMergeDataAction, (state, { payload }) => `${payload}`)
    .addCase(MergeActions.ClearMergeDataAction, () => null),
);
