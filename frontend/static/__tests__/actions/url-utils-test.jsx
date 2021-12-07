import { buildURLParams } from '../../actions/url-utils';

describe('url-utils tests', () => {
  it('url-utils: testing URL_KEYS', () => {
    const params = {
      filters: {},
      ids: [0, 5],
      sortInfo: [['col1', 'ASC']],
      query: 'col == 3',
      selectedCols: ['col1', 'col2'],
    };
    const urlParams = buildURLParams(params);
    expect(urlParams).toEqual({
      cols: '["col1","col2"]',
      query: 'col == 3',
      sort: '[["col1","ASC"]]',
      ids: '[0,5]',
    });
  });
});
