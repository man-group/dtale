describe('dtale tests', () => {
  const { location } = window;

  beforeAll(() => {
    delete (window as any).location;
    (window as any).location = {
      search: `?col=foo&vals=a,b,c&baz=${JSON.stringify({ bizz: [1, 2] })}`,
    };
  });

  afterAll(() => {
    window.location = location;
  });

  it('dtale: testing getParams', () => {
    const actions = require('../../redux/actions/dtale');
    const urlParams = actions.getParams();
    expect({
      col: 'foo',
      vals: ['a', 'b', 'c'],
      baz: JSON.stringify({ bizz: [1, 2] }),
    }).toEqual(urlParams);
  });
});
