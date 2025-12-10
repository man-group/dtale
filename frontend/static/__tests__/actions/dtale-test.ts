import * as windowUtils from '../../location';

describe('dtale tests', () => {
  it('dtale: testing getParams', () => {
    const actions = require('../../redux/actions/dtale');
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ search: `?col=foo&vals=a,b,c&baz=${JSON.stringify({ bizz: [1, 2] })}` } as any);
    const urlParams = actions.getParams();
    expect({
      col: 'foo',
      vals: ['a', 'b', 'c'],
      baz: JSON.stringify({ bizz: [1, 2] }),
    }).toEqual(urlParams);
  });
});
