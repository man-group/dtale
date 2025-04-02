import { Store } from '@reduxjs/toolkit';
import React from 'react';
import { Provider } from 'react-redux';

import ColumnAnalysis from '../popups/analysis/ColumnAnalysis';
import LibrarySymbolSelector from '../popups/arcticdb/LibrarySymbolSelector';
import { CodeExport } from '../popups/CodeExport';
import { Correlations } from '../popups/correlations/Correlations';
import CreateColumn from '../popups/create/CreateColumn';
import { CreateColumnType, PrepopulateCreateColumn, SaveAs } from '../popups/create/CreateColumnState';
import Describe from '../popups/describe/Describe';
import Duplicates from '../popups/duplicates/Duplicates';
import FilterPopup from '../popups/filter/FilterPopup';
import Instances from '../popups/instances/Instances';
import MergeDatasets from '../popups/merge/MergeDatasets';
import PredictivePowerScore from '../popups/pps/PredictivePowerScore';
import { RawPandasOutput } from '../popups/RawPandasOutput';
import CreateReplacement from '../popups/replacement/CreateReplacement';
import Reshape from '../popups/reshape/Reshape';
import Upload from '../popups/upload/Upload';
import Variance from '../popups/variance/Variance';
import * as actions from '../redux/actions/dtale';
import { getHiddenValue, toJson } from '../redux/reducers/utils';
import { InstanceSettings } from '../redux/state/AppState';
import { appStore, mergeStore } from '../redux/store';

require('../dtale/DataViewer.css');

/** Popup component properties */
interface PopupProps {
  pathname: string;
}
export const Popup: React.FC<PopupProps> = ({ pathname }) => {
  const [store, content] = React.useMemo(() => {
    const settings = toJson<InstanceSettings>(getHiddenValue('settings'));
    const dataId = getHiddenValue('data_id');
    const pathSegs = pathname.split('/');
    const popupType = pathSegs[pathSegs.length - 1] === 'code-popup' ? 'code-popup' : pathSegs[3];
    const chartData: Record<string, any> = {
      ...actions.getParams(),
      ...(settings.query ? { query: settings.query } : {}),
    };
    let rootNode: React.ReactNode = null;
    switch (popupType) {
      case 'filter':
        rootNode = <FilterPopup />;
        break;
      case 'correlations':
        rootNode = <Correlations />;
        break;
      case 'merge':
        rootNode = <MergeDatasets />;
        break;
      case 'pps':
        rootNode = <PredictivePowerScore />;
        break;
      case 'describe':
        rootNode = <Describe />;
        break;
      case 'variance':
        rootNode = <Variance />;
        break;
      case 'build':
        rootNode = <CreateColumn />;
        break;
      case 'duplicates':
        rootNode = <Duplicates />;
        break;
      case 'type-conversion': {
        const prePopulated: PrepopulateCreateColumn = {
          type: CreateColumnType.TYPE_CONVERSION,
          saveAs: SaveAs.INPLACE,
          cfg: { col: chartData.selectedCol, applyAllType: false },
        };
        rootNode = <CreateColumn prePopulated={prePopulated} />;
        break;
      }
      case 'cleaners': {
        const prePopulated: PrepopulateCreateColumn = {
          type: CreateColumnType.CLEANING,
          cfg: { col: chartData.selectedCol, cleaners: [] },
        };
        rootNode = <CreateColumn prePopulated={prePopulated} />;
        break;
      }
      case 'replacement':
        rootNode = <CreateReplacement />;
        break;
      case 'reshape':
        rootNode = <Reshape />;
        break;
      case 'column-analysis':
        rootNode = <ColumnAnalysis {...{ dataId, chartData }} height={250} />;
        break;
      case 'instances':
        rootNode = <Instances />;
        break;
      case 'code-export':
        rootNode = <CodeExport />;
        break;
      case 'raw-pandas':
        rootNode = <RawPandasOutput />;
        break;
      case 'arcticdb':
        rootNode = <LibrarySymbolSelector />;
        break;
      case 'upload':
      default:
        rootNode = <Upload />;
        break;
    }
    return [popupType === 'merge' ? mergeStore : appStore, rootNode];
  }, [pathname]);

  return <Provider store={store as Store}>{content}</Provider>;
};
