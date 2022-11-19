import numeral from 'numeral';
import React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  AutoSizer as _AutoSizer,
  Column as _Column,
  Table as _Table,
  AutoSizerProps,
  ColumnProps,
  TableProps,
} from 'react-virtualized';

import { Bouncer } from '../../Bouncer';
import * as gu from '../../dtale/gridUtils';
import { AppState } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as InstanceRepository from '../../repository/InstanceRepository';
import { truncate } from '../../stringUtils';
import { DataPreview } from '../merge/DataPreview';

import { InstanceLabel } from './InstanceLabel';

require('./Instances.css');

const AutoSizer = _AutoSizer as unknown as React.FC<AutoSizerProps>;
const Column = _Column as unknown as React.FC<ColumnProps>;
const Table = _Table as unknown as React.FC<TableProps>;

const Instances: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, iframe } = useSelector((state: AppState) => ({ dataId: state.dataId, iframe: state.iframe }));
  const [instances, setInstances] = React.useState<InstanceRepository.Instance[]>([]);
  const [error, setError] = React.useState<JSX.Element>();
  const [loadingInstances, setLoadingInstances] = React.useState(true);
  const [preview, setPreview] = React.useState<InstanceRepository.Instance>();

  React.useEffect(() => {
    InstanceRepository.load().then((response) => {
      setLoadingInstances(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response?.success) {
        setInstances(response.data);
        const processesInput: HTMLElement | null = document.getElementById('processes');
        if (processesInput) {
          (processesInput as HTMLInputElement).value = `${response.data.length}`;
        }
      }
    });
  }, []);

  const cleanup = async (instance: InstanceRepository.Instance): Promise<void> => {
    const response = await InstanceRepository.cleanupInstance(instance.data_id);
    if (response?.success) {
      setInstances(instances.filter(({ data_id }) => data_id !== instance.data_id).map((i) => ({ ...i })));
    }
  };

  if (loadingInstances) {
    return <Bouncer />;
  }

  if (error) {
    return error;
  }

  return (
    <div key="body" className="modal-body">
      <div className="row">
        <div className="col-md-12">
          <AutoSizer disableHeight={true} className="instances-sizer">
            {({ width }) => (
              <Table
                height={200}
                autoHeight={true}
                headerHeight={gu.ROW_HEIGHT}
                overscanRowCount={10}
                rowStyle={{ display: 'flex' }}
                rowHeight={gu.ROW_HEIGHT}
                rowGetter={({ index }) => instances[index]}
                rowCount={instances.length}
                rowClassName={({ index }) =>
                  index < 0 ? '' : dataId === instances[index].data_id ? 'active' : 'clickable'
                }
                width={width}
                onRowClick={({ rowData }) => {
                  if (rowData.data_id === dataId) {
                    return;
                  }
                  const newLoc = `${window.location.origin}/dtale/${iframe ? 'iframe' : 'main'}/${rowData.data_id}`;
                  if (window.location.pathname.startsWith('/dtale/popup/instances')) {
                    window.opener.location.assign(newLoc);
                    window.close();
                    return;
                  }
                  window.location.assign(newLoc);
                }}
                className="instances"
                headerClassName="headerCell"
              >
                {instances.length > 1 && (
                  <Column
                    width={50}
                    dataKey="data_id"
                    label=""
                    style={{ textAlign: 'center' }}
                    cellRenderer={({ rowData }) =>
                      rowData.data_id !== dataId && (
                        <i
                          className="ico-delete"
                          onClick={(e) => {
                            cleanup(rowData);
                            e.stopPropagation();
                          }}
                        />
                      )
                    }
                    className="cell"
                  />
                )}
                <Column
                  dataKey="start"
                  label={t('Instance')}
                  width={200}
                  flexGrow={1}
                  style={{ textAlign: 'left', paddingLeft: '.5em' }}
                  cellRenderer={({ rowData }) => <InstanceLabel instance={rowData} />}
                  className="cell"
                />
                <Column
                  width={50}
                  dataKey="rows"
                  label={t('Rows')}
                  style={{
                    textAlign: 'right',
                    paddingRight: '.5em',
                    fontSize: '80%',
                  }}
                  className="cell"
                />
                <Column
                  width={50}
                  dataKey="columns"
                  label={t('Cols')}
                  style={{
                    textAlign: 'right',
                    paddingRight: '.5em',
                    fontSize: '80%',
                  }}
                  className="cell"
                />
                <Column
                  width={150}
                  flexGrow={1}
                  dataKey="names"
                  label={t('Column Names')}
                  style={{
                    textAlign: 'center',
                    paddingRight: '.5em',
                    fontSize: '80%',
                  }}
                  cellRenderer={({ rowData }) => (
                    <span title={rowData.names.length > 30 ? rowData.names.split(',').join('\n') : undefined}>
                      {truncate(rowData.names)}
                    </span>
                  )}
                  className="cell"
                />
                <Column
                  width={150}
                  dataKey="mem_usage"
                  label={t('Memory Usage (MB)')}
                  style={{
                    textAlign: 'center',
                    paddingRight: '.5em',
                    fontSize: '80%',
                  }}
                  cellRenderer={({ rowData }) => numeral(rowData.mem_usage).format('0.00b')}
                  className="cell"
                />
                {instances.length > 1 && (
                  <Column
                    width={75}
                    dataKey="data_id"
                    label=""
                    style={{
                      textAlign: 'center',
                      paddingRight: '.5em',
                      fontSize: '80%',
                    }}
                    cellRenderer={({ rowData }) =>
                      rowData.data_id !== dataId && (
                        <button
                          className="preview-btn"
                          onClick={(e) => {
                            setPreview(rowData);
                            e.stopPropagation();
                          }}
                        >
                          Preview
                        </button>
                      )
                    }
                    className="cell"
                  />
                )}
              </Table>
            )}
          </AutoSizer>
        </div>
      </div>
      {preview && (
        <React.Fragment>
          <div className="row pt-5">
            <div className="col-md-12">
              <h4 key={0} className="preview-header">
                <div>
                  <InstanceLabel instance={preview} />
                  <span className="d-inline pl-3">{t('Preview')}</span>
                </div>
              </h4>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12" style={{ height: 200 }}>
              <DataPreview dataId={preview.data_id} />
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default withTranslation('instance')(Instances);
