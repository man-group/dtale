import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { useAppSelector } from '../../redux/hooks';
import { selectDataId } from '../../redux/selectors';
import { SortDir } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as DescribeRepository from '../../repository/DescribeRepository';

import { SequentialDiffs } from './DescribeState';
import { Stat } from './Stat';

/** Component properties for DetailsSequentialDiffs */
interface DetailSequentialDiffsProps {
  data: SequentialDiffs;
  column: string;
}

const DetailsSequentialDiffs: React.FC<DetailSequentialDiffsProps & WithTranslation> = ({ data, column, t }) => {
  const dataId = useAppSelector(selectDataId);
  const sortOptions = React.useMemo(
    () => [
      { label: t('None'), value: undefined },
      { label: t('Asc'), value: SortDir.ASC },
      { label: t('Desc'), value: SortDir.DESC },
    ],
    [t],
  );

  const [sort, setSort] = React.useState<SortDir>();
  const [sortedDiffs, setSortedDiffs] = React.useState<Record<SortDir, SequentialDiffs>>(
    {} as Record<SortDir, SequentialDiffs>,
  );
  const [error, setError] = React.useState<JSX.Element>();

  React.useEffect(() => {
    setSort(undefined);
    setSortedDiffs({} as Record<SortDir, SequentialDiffs>);
    setError(undefined);
  }, [column]);

  const loadSortedDiffs = async (updatedSort?: SortDir): Promise<void> => {
    if (!updatedSort || sortedDiffs[updatedSort]) {
      setSort(updatedSort);
      return;
    }
    const response = await DescribeRepository.loadSequentialDiffs(dataId, column, updatedSort);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    if (response) {
      setSortedDiffs({ ...sortedDiffs, [updatedSort]: response });
      setSort(updatedSort);
      setError(undefined);
    }
  };

  const currData = !sort ? data : sortedDiffs[sort];
  return (
    <React.Fragment>
      {error}
      <li>
        <div>
          <h4 className="d-inline">Sequential Diffs</h4>
          <ButtonToggle options={sortOptions} update={loadSortedDiffs} defaultValue={sort} />
        </div>
        <ul>
          <Stat t={t} field="Min" value={currData.min} />
          <Stat t={t} field="Average" value={currData.avg} />
          <Stat t={t} field="Max" value={currData.max} />
        </ul>
      </li>
    </React.Fragment>
  );
};

export default withTranslation('describe')(DetailsSequentialDiffs);
